# RegTest Hub — Regression Testing Platform

**RegTest Hub** is a centralized regression testing platform designed for QA engineers, SDETs, and product teams to organize test cases, plan targeted regression cycles, and execute manual or exploratory tests with maximum speed and complete visibility.

---

## 🎯 Key Functional Capabilities

### 1. Project Management & Workspace Scoping
- **Centralized Dashboard**: Track all your applications, microservices, and repositories from a unified view.
- **Unique Project Keys & Initials**: Every project is assigned a unique 2–4 character uppercase identifier (e.g., `ESC` for *Ecommerce Storefront & Checkout*).
- **Team Access & Collaboration**: Project creators can invite team members by email with role assignments (`Member` / `Admin`) and manage access permissions.
- **Project Status Bar & Dual Pie Charts**:
  - **Priority Breakdown Chart**: Visual distribution of test cases across **P0 (Critical)**, **P1 (High)**, **P2 (Medium)**, and **P3 (Low)** with percentage metrics.
  - **Latest Run Outcome Chart**: Real-time status breakdown (Passed, Failed, Skipped, Pending) and pass rate % of the most recent regression cycle.

### 2. Test Case Catalog & Sequential Identifiers
- **Auto-Assigned Test Case Codes**: Every test case receives an auto-generated, sequential identifier prefixed by the project key (e.g., `ESC-1`, `ESC-2`, `ESC-3`).
- **Functional Modules**: Group test cases by domain (e.g., *Auth*, *Billing*, *Checkout*, *Cart*, *Settings*).
- **Severity & Priority Ratings**: Tag tests with **P0 (Blocker/Smoke)** through **P3 (Low)**.
- **Last Run Result Tracking**: The project test catalog displays the execution outcome from the latest regression run directly in the table (`Passed`, `Failed`, `Skipped`, `Pending`, or `Untested`).
- **Detailed Instructions**: Document pre-conditions, step-by-step reproduction instructions, and clear expected verification criteria.
- **Execution History**: Inspect historical pass/fail trends and defect notes logged across every regression cycle for each specific test case.

### 3. Targeted Regression Run Configuration
- **One-Click Presets**:
  - **Smoke Suite**: Instantly select all **P0 Blocker** tests for rapid deployment smoke validation.
  - **High Priority Suite**: Target **P0 + P1** critical paths before major releases.
  - **Module Runs**: Filter and run specific functional areas (e.g., test only *Billing* after a payment gateway update).
  - **Full Regression**: Select the entire catalog for comprehensive release qualification.
- **Custom Selection**: Hand-pick individual test cases using interactive checklists with instant search and priority filters.

### 4. Interactive Tester Execution Console
- **Distraction-Free Runner**: Split-pane interface optimized for speed during active manual execution cycles.
- **Keyboard Shortcuts**:
  - <kbd>P</kbd> — Mark test as **PASSED** and auto-advance to next test.
  - <kbd>F</kbd> — Mark test as **FAILED** and record defect notes.
  - <kbd>S</kbd> — **SKIP** test.
  - <kbd>←</kbd> / <kbd>→</kbd> — Navigate previous / next tests.
- **Live Test Queue**: Search, filter by module, and see remaining unexecuted tests in real time with test case codes (`ESC-1`).
- **Defect Notes & Logs**: Record failure reproduction steps, API error codes, and tester observations directly into the execution report.
- **Live Progress Meter**: Real-time progress bar, ratio counters, and celebratory confetti upon completing all tests.

### 5. Comprehensive Run Reports & Analytics
- **Overall Run Status Pie Chart**: Visual vector chart with hover inspection and interactive legend filtering across Passed, Failed, Skipped, and Pending tests.
- **Summary Indexes & Metrics**: Clear executive numbers for Total Tests, Pass Rate %, Defect count, and total execution duration (e.g., `12m 45s`).
- **Module-Wise Status Breakdown Table**:
  - Aggregates tests, passed, failed, skipped, and pending per module.
  - Color-coded **Module Health & Pass Rate %** progress bars.
  - **1-Click Quick Filter**: Instantly isolate detailed test results for any specific module.
- **Searchable Results & Defect Triage**: Filter by execution status, search defect notes, and expand step-by-step pre-conditions and expected results.

---

## 🚀 Typical User Workflow

```text
1. Create Project ──► 2. Catalog Test Cases ──► 3. Launch Regression Run ──► 4. Execute with Hotkeys ──► 5. Review Report
   (Key: ESC)             (ESC-1, ESC-2, P0-P3)      (Smoke / Full Suite)         (P = Pass, F = Fail)          (Pie Chart & Module Table)
```

1. **Set Up a Project**: Provide your application name, scope description, and unique project key initials (e.g., `ESC`).
2. **Catalog Test Cases**: Add test cases with steps, expected outcomes, module tags, and priorities. Test case codes (`ESC-1`, `ESC-2`) are auto-assigned.
3. **Start a Regression Run**: Choose a run preset (e.g., *Smoke Suite*) or select target test cases.
4. **Execute in the Runner**: Use rapid hotkeys or action buttons to record outcomes and log defect observations.
5. **Analyze Results**: Review the overall status pie chart, module-wise health table, and share pass/fail reports with your team.
