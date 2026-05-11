import { createContext, useContext, useReducer } from 'react'
import { differenceInCalendarDays } from 'date-fns'

const BookingContext = createContext()

const initialState = {
  hotel:          null,
  dates:          { checkIn: null, checkOut: null },
  guests:         { adults: 2, children: 0 },
  selectedRoom:   null,
  quotation:      null,   // respuesta completa del RPC v4
  guestInfo:      null,
  specialRequests: [],
}

function bookingReducer(state, action) {
  switch (action.type) {
    case 'SET_HOTEL':
      return { ...initialState, hotel: action.payload }
    case 'SET_DATES':
      return { ...state, dates: action.payload, quotation: null }
    case 'SET_GUESTS':
      return { ...state, guests: action.payload, quotation: null }
    case 'SET_ROOM_AND_QUOTE':
      return { ...state, selectedRoom: action.payload.room, quotation: action.payload.quotation }
    case 'SET_GUEST_INFO':
      return { ...state, guestInfo: action.payload }
    case 'SET_SPECIAL_REQUESTS':
      return { ...state, specialRequests: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function BookingProvider({ children }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState)
  const nights = state.dates.checkIn && state.dates.checkOut
    ? differenceInCalendarDays(new Date(state.dates.checkOut), new Date(state.dates.checkIn))
    : 0
  return (
    <BookingContext.Provider value={{ state, dispatch, nights }}>
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => useContext(BookingContext)
