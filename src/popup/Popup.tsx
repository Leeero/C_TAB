/*
 * @Author       : leroli
 * @Date         : 2024-12-23 12:07:04
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-23 12:11:08
 * @Description  : 
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Popup } from './PopupComponent'
import './Popup.css'

createRoot(document.getElementById('popup-root')!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
) 