import React from 'react'
import { createRoot } from 'react-dom/client'
import PopupComponent from './PopupComponent'
import './Popup.css'

const root = createRoot(document.getElementById('popup-root')!)
root.render(<PopupComponent onSave={() => {}} onAddCategory={() => Promise.resolve({} as any)} />) 