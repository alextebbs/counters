package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/lib/pq"
)

type Counter struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Count     int       `json:"count"`
	Timestamp time.Time `json:"timestamp"`
}

type Event struct {
	ID        int           `json:"id"`
	Title     string        `json:"title"`
	Duration  time.Duration `json:"duration"`
	CreatedAt time.Time     `json:"created_at"`
}

var db *sql.DB

// hate cors
func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
}

func main() {
	var err error

	// Initialize the database connection
	host := "postgres"
	port := 5432
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")

	psqlInfo := fmt.Sprintf("sslmode=disable host=%s port=%d user=%s password=%s dbname=%s",
		host, port, user, password, dbname)

	db, err = sql.Open("postgres", psqlInfo)

	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()

	// Verify the connection to the database
	err = db.Ping()

	if err != nil {
		log.Fatal(err)
	}

	log.Println("Successfully connected to the database!")

	// Set up the HTTP server
	// http.HandleFunc("/", handleIndex)
	http.HandleFunc("/counters", handleCounters)
	http.HandleFunc("/events", handleEvents)
	http.HandleFunc("/counters/increment", handleIncrementCounter)
	http.HandleFunc("/counters/delete", handleDeleteCounter)

	log.Println("Starting the server on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// func handleIndex(w http.ResponseWriter, r *http.Request) {
// 	io.WriteString(w, "Hello world!")
// }

// Create a counter or retrieve existing counter
func handleCounters(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodPost:
		handleCreateCounter(w, r)
	case http.MethodGet:
		handleGetCounters(w, r)
	default:
		http.Error(w, fmt.Sprintf("Method '%v' not allowed", r.Method), http.StatusMethodNotAllowed)
	}
}

// Get all events associated with a counter ID
func handleEvents(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Check that the request method is GET
	if r.Method != http.MethodGet {
		msg := fmt.Sprintf("Method '%v' not allowed. Method must be '%v'", r.Method, http.MethodGet)
		http.Error(w, msg, http.StatusMethodNotAllowed)
		return
	}

	// Parse the counter ID from the query parameters
	ids, ok := r.URL.Query()["id"]

	if !ok || len(ids[0]) < 1 {
		http.Error(w, "Missing required URL param: id", http.StatusBadRequest)
		return
	}

	// Query the database
	rows, err := db.Query(`SELECT event_id, title, duration, created_at FROM events WHERE counter_id = $1`, ids[0])
	if err != nil {
		http.Error(w, "Failed to retrieve events", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Iterate through the rows and append to events slice
	var events []Event
	for rows.Next() {
		var e Event
		if err := rows.Scan(&e.ID, &e.Title, &e.Duration, &e.CreatedAt); err != nil {
			log.Printf("Failed to scan event: %v", err)
			http.Error(w, "Failed to scan event", http.StatusInternalServerError)
			return
		}
		events = append(events, e)
	}

	// Check for errors from iterating over rows
	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to read events", http.StatusInternalServerError)
		return
	}

	// Respond with the retrieved events
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(events)
}

// Handles creating a new counter
func handleCreateCounter(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var err error

	// Parse the counter title from the request body
	var req struct {
		Title      string `json:"title"`
		EventTitle string `json:"eventTitle"`
	}

	var c Counter

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create the counter in the database
	err = db.QueryRow(
		`INSERT INTO counters (title, count, timestamp) VALUES ($1, $2, $3) RETURNING counter_id, title, timestamp`,
		req.Title, 1, time.Now(),
	).Scan(&c.ID, &c.Title, &c.Timestamp)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Printf("Failed to create counter: %v", err)
		return
	}

	// Create an 'init' event to go with the counter
	_, err = db.Exec(`INSERT INTO events (counter_id, title, duration) VALUES ($1, $2, $3)`, c.ID, req.EventTitle, time.Duration(0))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Printf("Failed to create counter: %v", err)
		return
	}

	// Respond with the new counter
	json.NewEncoder(w).Encode(c)
}

// Retrieves counters from the database, either all counters or a single counter by ID
func handleGetCounters(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Parse the counter ID from the query parameters
	ids, ok := r.URL.Query()["id"]

	// Initialize SQL statement and args slice
	var (
		sqlStatement string
		args         []interface{}
	)

	if !ok || len(ids[0]) < 1 {
		// If 'id' parameter is missing, fetch all counters
		sqlStatement = `SELECT counter_id, title, count, timestamp FROM counters`
	} else {
		// If 'id' parameter is present, fetch the counter with that ID
		id, err := strconv.Atoi(ids[0])
		if err != nil {
			http.Error(w, "Invalid counter ID", http.StatusBadRequest)
			return
		}

		sqlStatement = `SELECT counter_id, title, count, timestamp FROM counters WHERE counter_id = $1`
		args = append(args, id)
	}

	// Query the database
	rows, err := db.Query(sqlStatement, args...)
	if err != nil {
		http.Error(w, "Failed to retrieve counters", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Iterate through the rows and append to counters slice
	var counters []Counter
	for rows.Next() {
		var c Counter
		if err := rows.Scan(&c.ID, &c.Title, &c.Count, &c.Timestamp); err != nil {
			http.Error(w, "Failed to scan counter", http.StatusInternalServerError)
			return
		}
		counters = append(counters, c)
	}

	// Check for errors from iterating over rows
	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to read counters", http.StatusInternalServerError)
		return
	}

	// Respond with the retrieved counters
	json.NewEncoder(w).Encode(counters)
}

// Increment a counter and return the new counter and created event
func handleIncrementCounter(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	fmt.Printf("Method: %v\n", r.Method)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Check that the request method is POST
	if r.Method != http.MethodPost {
		msg := fmt.Sprintf("Method '%v' not allowed. Method must be '%v'", r.Method, http.MethodPost)
		http.Error(w, msg, http.StatusMethodNotAllowed)
		return
	}

	// Unmarshal the request
	var req struct {
		ID    int    `json:"counter_id"`
		Title string `json:"title"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Make sure the required fields are present
	if req.ID == 0 || req.Title == "" {
		http.Error(w, "Missing required fields: counter_id and/or title", http.StatusBadRequest)
		return
	}

	// Start a transaction
	tx, err := db.Begin()
	if err != nil {
		http.Error(w, "Failed to begin transaction", http.StatusInternalServerError)
		return
	}

	// Calculate the duration since the last event for this counter
	var lastTimestamp time.Time
	err = tx.QueryRow(`SELECT MAX(created_at) FROM events WHERE counter_id = $1`, req.ID).Scan(&lastTimestamp)
	if err != nil && err != sql.ErrNoRows {
		tx.Rollback()
		http.Error(w, "Failed to retrieve last timestamp", http.StatusInternalServerError)
		return
	}

	// Increment the counter in the counters table
	var c Counter
	err = tx.QueryRow(
		`UPDATE counters SET count = count + 1, timestamp = NOW() WHERE counter_id = $1 RETURNING counter_id, title, count, timestamp`,
		req.ID,
	).Scan(&c.ID, &c.Title, &c.Count, &c.Timestamp)

	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to increment counter", http.StatusInternalServerError)
		return
	}

	// Insert a new event into the events table
	var e Event
	var duration time.Duration = time.Since(lastTimestamp)
	e.Duration = duration

	err = tx.QueryRow(
		`INSERT INTO events (counter_id, title, duration) VALUES ($1, $2, $3) RETURNING event_id, title, created_at`,
		req.ID, req.Title, duration,
	).Scan(&e.ID, &e.Title, &e.CreatedAt)

	if err != nil {
		tx.Rollback()
		log.Printf("Failed to create event: %v", err)
		http.Error(w, "Failed to create event log", http.StatusInternalServerError)
		return
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Respond with the new counter
	var res struct {
		Event   Event   `json:"event"`
		Counter Counter `json:"counter"`
	}

	res.Event, res.Counter = e, c
	json.NewEncoder(w).Encode(res)
}

// Delete a counter and the events associated with it
func handleDeleteCounter(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Check that the request method is POST
	if r.Method != http.MethodDelete {
		msg := fmt.Sprintf("Method '%v' not allowed. Method must be '%v'", r.Method, http.MethodDelete)
		http.Error(w, msg, http.StatusMethodNotAllowed)
		return
	}

	// Unmarshal the request
	var req struct {
		ID int `json:"counter_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Make sure the required fields are present
	if req.ID == 0 {
		http.Error(w, "Missing required fields: counter_id", http.StatusBadRequest)
		return
	}

	// Start a transaction
	tx, err := db.Begin()
	if err != nil {
		http.Error(w, "Failed to begin transaction", http.StatusInternalServerError)
		return
	}

	// Delete the events associated with the counter in the events table
	_, err = tx.Exec(
		`DELETE FROM events WHERE counter_id = $1`,
		req.ID,
	)

	if err != nil {
		tx.Rollback()
		log.Printf("Failed to delete event: %v", err)
		http.Error(w, "Failed to delete event log", http.StatusInternalServerError)
		return
	}

	// Delete the counter in the counters table
	_, err = tx.Exec(
		`DELETE FROM counters WHERE counter_id = $1`,
		req.ID,
	)

	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to delete counter", http.StatusInternalServerError)
		return
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	io.WriteString(w, fmt.Sprintf("Counter %v deleted", req.ID))
}
