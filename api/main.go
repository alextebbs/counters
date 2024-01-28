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
	Timestamp time.Time     `json:"timestamp"`
}

var db *sql.DB

func main() {
	var err error

	// Initialize the database connection
	host := "postgres-service"
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
	http.HandleFunc("/counters/increment", handleIncrementCounter)

	log.Println("Starting the server on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "Hello world!")
}

// handleCounter creates a new counter or retrieves an existing counter
func handleCounters(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		handleCreateCounter(w, r)
	case http.MethodGet:
		handleGetCounters(w, r)
	default:
		http.Error(w, fmt.Sprintf("Method '%v' not allowed", r.Method), http.StatusMethodNotAllowed)
	}
}

// createCounter handles creating a new counter
func handleCreateCounter(w http.ResponseWriter, r *http.Request) {
	// Parse the counter name from the request body
	var c Counter

	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create the counter in the database
	sqlStatement := `INSERT INTO counters (name, count, timestamp) VALUES ($1, $2, $3) RETURNING id, timestamp`
	err := db.QueryRow(sqlStatement, c.Title, 0, time.Now()).Scan(&c.ID, &c.Timestamp)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Printf("Failed to create counter: %v", err)
		return
	}

	// Respond with the new counter
	json.NewEncoder(w).Encode(c)
}

// getCounter handles retrieving a counter by its ID
func handleGetCounters(w http.ResponseWriter, r *http.Request) {
	// Parse the counter ID from the query parameters
	ids, ok := r.URL.Query()["id"]

	// Initialize SQL statement and args slice
	var (
		sqlStatement string
		args         []interface{}
	)

	if !ok || len(ids[0]) < 1 {
		// If 'id' parameter is missing, fetch all counters
		sqlStatement = `SELECT id, name, count, timestamp FROM counters`
	} else {
		// If 'id' parameter is present, fetch the counter with that ID
		id, err := strconv.Atoi(ids[0])
		if err != nil {
			http.Error(w, "Invalid counter ID", http.StatusBadRequest)
			return
		}

		sqlStatement = `SELECT id, name, count, timestamp FROM counters WHERE id = $1`
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

// handleIncrement handles incrementing a counter's count
func handleIncrementCounter(w http.ResponseWriter, r *http.Request) {
	// Parse the counter ID from the query parameters
	ids, ok := r.URL.Query()["id"]
	if !ok || len(ids[0]) < 1 {
		http.Error(w, "Missing counter ID", http.StatusBadRequest)
		return
	}

	// Parse the counter ID from the query parameters
	id, err := strconv.Atoi(ids[0])
	if err != nil {
		http.Error(w, "Invalid counter ID", http.StatusBadRequest)
		return
	}

	// Parse the message from the request body
	var e Event

	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
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
	err = tx.QueryRow(`SELECT MAX(created_at) FROM events WHERE counter_id = $1`, id).Scan(&lastTimestamp)
	if err != nil && err != sql.ErrNoRows {
		tx.Rollback()
		http.Error(w, "Failed to retrieve last timestamp", http.StatusInternalServerError)
		return
	}
	duration := time.Now().Sub(lastTimestamp)

	// Increment the counter in the counters table
	_, err = tx.Exec(`UPDATE counters SET count = count + 1 WHERE id = $1`, id)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to increment counter", http.StatusInternalServerError)
		return
	}

	// Insert a new event into the events table
	_, err = tx.Exec(`INSERT INTO events (counter_id, reason, duration) VALUES ($1, $2, $3)`, id, e.Title, duration)
	if err != nil {
		tx.Rollback()
		http.Error(w, "Failed to log event", http.StatusInternalServerError)
		return
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Respond to the request indicating success...
}
