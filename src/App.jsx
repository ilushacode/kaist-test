import { useState } from 'react'
import './App.css'
import { HeaderComponent } from './components/HeaderComponent'
import { DayListComponent } from './components/DayListComponent'
import { ScheduleComponent } from './components/ScheduleComponent'

function App() {

  return (
    <div className="container theme_light">
      <HeaderComponent />
      <DayListComponent />
      <ScheduleComponent />
    </div>
  )
}

export default App
