# Jacinto Nemeño Integrated School - Program Implementation Review (PIR)
## SY 2026-2027 Second Quarter Review

This project is a modern Next.js React application migrating the JNIS PIR presentation slide deck into a highly interactive, state-persisted presenter dashboard.

### 🌟 Features

1. **Presenter & Editor Layout**:
   - **Presenter Mode**: A sleek fullscreen mode that hides sidebars for distraction-free presenting.
   - **Editor Mode**: Activates the Left Thumbnail rail, Right Customizer panel, and enables inline double-click editing.
2. **Left Slide Rail**:
   - Lists all presentation slides with dynamic slide numbers, labels, and real-time previews of speaker notes.
   - Smooth auto-scrolling to the active slide when navigating via keyboard (arrows, space, pgup/pgdn).
3. **Right Customizer Panel**:
   - **Theme Picker**: On-the-fly vibe accent changes (Slate, DepEd, Emerald, Sunset).
   - **Transitions Selector**: Custom slide transition effects (Cross Fade, Slide Horizontal, Zoom Center, None).
   - **Speaker Notes**: Real-time editable notes per slide, auto-saved to state.
4. **Interactive Enrolment Dashboard (Slide 4)**:
   - Consolidates the enrolment tracking steps into a 5-step wizard:
     - **Kindergarten**: Radial Gauges (Actual vs. Target)
     - **Elementary**: Responsive Spline Area Chart (Targets vs. Actuals over 3 years)
     - **Junior High**: Grouped Column Bars (Targets vs. Actuals over 3 years)
     - **Senior High**: Segmented Donut Chart (Grade 11 vs. Grade 12 breakdown)
     - **Cohort Tracking**: Flow Diagram representing learner transition flows
   - Ranges and sliders adjust values instantly with animated SVG charts.
   - Finding and Recommended Action fields can be edited inline.
5. **API Persistence**:
   - Auto-saves all slide text changes, theme options, speaker notes, and dashboard parameters to `public/.pir-deck.state.json` via `/api/save-state` route.

---

### 🚀 Getting Started

#### 1. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

#### 2. Run the Development Server
```bash
npm run dev
```

#### 3. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)**.
- Use **Left/Right Arrow keys**, **Page Up/Down**, or **Spacebar** to navigate slides.
- Toggle **Editor** in the top right to adjust values or change speaker notes.
- Double-click on any text in normal slides to edit it inline, then click away to save.
- Use the **Reset Deck** button to jump back to slide 1.

#### 4. Build for Production
To build the optimized production package:
```bash
npm run build
```
And to start the production server:
```bash
npm start
```
