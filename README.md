# Timeline - Interactive Event Visualization

A beautiful, modern web application for visualizing events, tasks, and milestones on an interactive timeline.

## ✨ Features

### Core Functionality
- **🔍 Multi-scale Zoom**: From hours to decades - seamlessly zoom in and out
  - Hour view: See your day in detail
  - Day/Week/Month views: Plan your schedule
  - Year/Decade views: Get the big picture
  
- **📅 Event Types**:
  - **Point events**: Meetings, appointments, deadlines
  - **Duration events**: Projects, trips, courses
  - **Milestones**: Important achievements and goals
  - **Recurring events**: Daily standups, weekly gym sessions, monthly reviews

- **🎨 Visual Design**:
  - Sleek dark theme with refined typography (DM Sans + JetBrains Mono)
  - Minimalistic dot pattern background
  - Color-coded events based on tags
  - Smooth animations and micro-interactions
  - Pin-based event display with hover tooltips

- **🏷️ Organization**:
  - Custom tags with colors (Work, Personal, Health, Finance, Social, Learning)
  - Events alternate above/below timeline with smart positioning
  - Automatic layout to avoid overlaps

- **🚀 Navigation & Interaction**:
  - **Mouse wheel**: Zoom in/out
  - **Click & drag timeline**: Pan through time
  - **Drag event pins**: Change event dates instantly
  - **Double-click**: Create event at date
  - **Today button**: Jump to current date
  - **Comprehensive keyboard shortcuts**

### Currently Implemented
✅ Timeline rendering with adaptive date markers  
✅ Zoom levels (7 different scales: hour → decade)  
✅ Event display with all 4 types  
✅ Recurring event instances  
✅ IndexedDB persistence  
✅ Default tags (6 categories)  
✅ Sample data for demo  
✅ Responsive design  
✅ Today indicator  
✅ **Event creation/editing modal**  
✅ **Filter panel** (by tag, date, type)  
✅ **Search functionality** (title/description)  
✅ **Import/Export JSON**  
✅ **Drag-and-drop event editing**  
✅ **Statistics dashboard**  
✅ **Keyboard shortcuts**  

### Coming Soon
🚧 Event reminders & browser notifications  
🚧 Region selection for screenshots  
🚧 Export timeline as image/PDF  

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5174`

### Build for Production

```bash
npm run build
npm run preview
```

## 🎯 Usage

### Basic Navigation
1. **Zoom**: Scroll mouse wheel up/down or press `+`/`-`
2. **Pan**: Click and drag horizontally on timeline
3. **Go to Today**: Click "Today" button or press `Home`

### Working with Events

#### Creating Events
- **Double-click** on timeline at desired date
- Or press `N` or `Ctrl+N`
- Or click **"New"** button in header

#### Editing Events
- **Click on event pin** to open edit modal
- **Drag event pin** to change its date
- Delete via edit modal

#### Viewing Events
- **Hover** over event pin to see tooltip with full details
- Tooltip shows icon, title, description, dates, and tags

### Filtering & Search
1. Click **Filter icon** or press `Ctrl+F`
2. Filter panel opens from right
3. Options:
   - **Search**: By title or description
   - **Date Range**: From/to dates
   - **Event Types**: Point, Duration, Milestone, Recurring
   - **Tags**: Filter by one or more tags

### Statistics Dashboard
- Click **Chart icon** in header to open stats panel
- Shows:
  - Total events
  - Upcoming events
  - Today's events
  - Past events
  - Breakdown by type
  - Breakdown by tag

### Event Types
- **📍 Point**: Single moment in time (meetings, deadlines)
- **📅 Duration**: Spans multiple days (projects, trips)
- **🚩 Milestone**: Important markers (achievements, goals)
- **🔁 Recurring**: Repeating patterns (daily/weekly/monthly)

### Import/Export
- **Import**: Click upload icon → select JSON file
- **Export**: Click download icon → saves timeline data as JSON

### Keyboard Shortcuts

Press `?` to see all shortcuts. Key bindings:

**Navigation:**
- `Home` - Jump to today
- `←` / `→` - Go back/forward 1 week
- `↑` / `↓` - Go back/forward 1 day
- `Shift + ←` / `→` - Go back/forward 1 month
- `Ctrl + ←` / `→` - Go back/forward 1 year

**Zoom:**
- `+` / `=` - Zoom in
- `-` - Zoom out

**Actions:**
- `N` or `Ctrl+N` - Create new event
- `Ctrl+F` - Toggle filter panel
- `?` - Show keyboard shortcuts
- `Esc` - Close modal/panel

**Timeline:**
- Click & drag - Pan through time
- Mouse wheel - Zoom in/out
- Double-click - Create event at date

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS v4** - Utility-first styling

### State Management
- **Zustand** - Lightweight state management
- **Dexie.js** - IndexedDB wrapper with reactive queries

### Utilities
- **date-fns** - Date manipulation
- **lucide-react** - Modern icon library
- **dexie-react-hooks** - Reactive database queries

## 📁 Project Structure

```
timeline/
├── src/
│   ├── components/
│   │   ├── Timeline/
│   │   │   └── TimelineCanvas.tsx     # Main timeline renderer
│   │   ├── Events/
│   │   │   ├── EventCard.tsx          # Event display with drag-n-drop
│   │   │   └── EventModal.tsx         # Event creation/editing
│   │   ├── Filters/
│   │   │   └── FilterPanel.tsx        # Search & filter sidebar
│   │   ├── Stats/
│   │   │   └── StatsPanel.tsx         # Statistics dashboard
│   │   └── Layout/
│   │       ├── Header.tsx             # Top navigation bar
│   │       └── ShortcutsHelp.tsx      # Keyboard shortcuts modal
│   ├── stores/
│   │   ├── timelineStore.ts           # Timeline state (zoom, position)
│   │   ├── uiStore.ts                 # UI state (modals, panels)
│   │   └── filterStore.ts             # Filter state
│   ├── services/
│   │   ├── db.ts                      # IndexedDB setup
│   │   ├── eventService.ts            # Event CRUD operations
│   │   └── sampleData.ts              # Demo data
│   ├── utils/
│   │   ├── zoomLevels.ts              # Zoom calculations
│   │   ├── dateUtils.ts               # Date formatting
│   │   ├── eventPositioning.ts        # Layout algorithm
│   │   └── useKeyboardShortcuts.ts    # Keyboard handler hook
│   ├── types/
│   │   └── index.ts                   # TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tailwind.config.js
```

## 🎨 Customization

### Adding Custom Tags
Tags are stored in IndexedDB. You can add more default tags by editing `src/services/db.ts`:

```typescript
{
  id: 'tag-custom',
  name: 'Custom',
  color: '#ff6b6b',
  createdAt: new Date()
}
```

### Adjusting Zoom Levels
Edit `src/utils/zoomLevels.ts` to modify zoom scales and tick intervals.

### Changing Fonts
Update `index.html` to import different Google Fonts, then modify `src/index.css` to use them.

## 📊 Data Persistence

All data is stored locally in your browser using **IndexedDB**:
- Events (including recurring patterns)
- Tags  
- User preferences

Data persists across browser sessions but is **browser-specific**. To backup or transfer your timeline, use the **Export** feature in the header.

## 🚀 Deployment

The app is a static SPA and can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- Any static hosting service

Simply run `npm run build` and deploy the `dist` folder.

## 🙏 Acknowledgments

- Design inspired by modern project management tools
- Icons by Lucide
- Fonts: DM Sans & JetBrains Mono (Google Fonts)
- Built with React, TypeScript, and Vite

---

**License**: MIT  
**Author**: Built with OpenCode
