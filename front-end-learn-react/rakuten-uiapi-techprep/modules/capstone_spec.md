# 🏆 Capstone Project: GATD Ad Dashboard Spec

We will now build a cohesive, fully functioning integration of your React/Redux UI dashboard and high-performance Go API. This will consolidate all your 4-Hour crash course knowledge into a single portfolio project ready to show Rakuten.

---

## 1. Project Directory Structure

We will scaffold this project under `/Users/ochadipa/interview_learn/front-end-learn-react/rakuten-uiapi-techprep/modules/capstone/` so you have an isolated sandbox.

```
modules/capstone/
├── backend/
│   └── main.go
└── frontend/
    ├── useDebounce.ts
    └── App.tsx
```

---

## 2. Step-by-Step Exercise Instructions

### Step 1: Run the Go API Server
Go to your terminal and start the backend:
```bash
go run modules/capstone/backend/main.go
```
This API runs concurrently on port `8080`. It queries campaign details using asynchronous goroutines with a strict timeout context of `500ms`.

### Step 2: Implement React Debouncing
Copy `useDebounce.ts` into your React project. This custom hook prevents API overload by only updating search keywords after the user stops typing for 300ms.

### Step 3: Run the Dashboard UI
Set up your React application and mount `App.tsx`. Click "Toggle Status" to trigger the Redux dispatch. Watch how Immer handles immutable state modification under the hood seamlessly.

---

## 3. Self-Verification Sandbox (Try it Offline!)

Review the pre-written source code in the next folder and verify you can explain every single mechanical line to an interviewer.
