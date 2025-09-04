import { useState } from 'react'
import { NavBar } from './components/NavBar'

function App() {
  return (
    <div className="flex flex-col w-screen h-screen">

      {/* NavBar */}
      <div className="NavBar">
        <NavBar/>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* grid setup */}
        <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full">
          <p>1</p>
          <p>2</p>
          <p>3</p>
          <p>4</p>
          <p>5</p>
          <p>6</p>
          <p>7</p>
          <p>8</p>
          <p>9</p>
        </div>

      </div>
    </div>    
  )
}

export default App
