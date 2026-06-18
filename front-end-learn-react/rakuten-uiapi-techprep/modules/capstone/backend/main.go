package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// Campaign represents an advertisement campaign processed for the UI Dashboard
type Campaign struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Impressions int    `json:"impressions"`
	Status      string `json:"status"`
}

// Simulated slow database metrics fetcher
func fetchCampaignDetails(ctx context.Context, id string, wg *sync.WaitGroup, ch chan<- Campaign) {
	defer wg.Done()

	select {
	case <-time.After(150 * time.Millisecond): // Simulate remote RPC latency
		ch <- Campaign{
			ID:          id,
			Name:        fmt.Sprintf("Tokyo Ad Campaign - %s", id),
			Impressions: int(time.Now().UnixNano() % 100000),
			Status:      "active",
		}
	case <-ctx.Done(): // Handle timeout context gracefully
		return
	}
}

// campaignHandler compiles and serves metrics concurrently
func campaignHandler(w http.ResponseWriter, r *http.Request) {
	// CORS Headers setup
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		return
	}

	// 500ms API SLA Timeout Context
	ctx, cancel := context.WithTimeout(r.Context(), 500*time.Millisecond)
	defer cancel()

	campaignIDs := []string{"101", "102", "103", "104"}
	campaignsChan := make(chan Campaign, len(campaignIDs))
	var wg sync.WaitGroup

	// Concurrently query database for campaigns
	for _, id := range campaignIDs {
		wg.Add(1)
		go fetchCampaignDetails(ctx, id, &wg, campaignsChan)
	}

	wg.Wait()
	close(campaignsChan)

	var list []Campaign
	for c := range campaignsChan {
		list = append(list, c)
	}

	json.NewEncoder(w).Encode(list)
}

func main() {
	http.HandleFunc("/api/campaigns", campaignHandler)
	fmt.Println("GATD Concurrent API running on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}
