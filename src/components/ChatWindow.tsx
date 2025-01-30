import { useState, useEffect, useRef } from "react"

interface Contact {
  id: string
  name: string
  contactName: string
  type: "user" | "group"
}

interface Message {
  type: "incoming" | "outgoing"
  text: string
  timestamp: number
  idMessage: string
}

interface ChatWindowProps {
  selectedContact: Contact | null
  messages: Message[]
  onSendMessage: (chatId: string, message: string) => void
  onSelectContact: (contact: Contact | null) => void
}

function ChatWindow({ selectedContact, messages, onSendMessage, onSelectContact }: ChatWindowProps) {
  const [inputMessage, setInputMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSelectContact(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onSelectContact])

  const handleSendMessage = () => {
    if (inputMessage.trim() && selectedContact) {
      onSendMessage(selectedContact.id, inputMessage)
      setInputMessage("")
    }
  }

  const formatPhoneNumber = (id: string) => {
    const match = id.match(/(\d+)@c\.us/)
    return match ? match[1] : ""
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messagesEndRef])

  return (
    <div className="flex-1 flex flex-col">
      {selectedContact ? (
        <>
          <div className="bg-gray-200 p-4">
            <h2 className="text-2xl font-bold">{selectedContact.name || selectedContact.contactName || "Unknown"}</h2>
            <p className="text-sm text-gray-600">{formatPhoneNumber(selectedContact.id)}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.idMessage}
                className={`max-w-xs p-2 rounded-lg ${
                  message.type === "incoming" ? "bg-gray-300 self-start" : "bg-green-300 self-end ml-auto"
                }`}
              >
                <p>{message.text}</p>
                <span className="text-xs text-gray-600">{new Date(message.timestamp * 1000).toLocaleTimeString()}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 bg-white border-t border-gray-300 flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-green-500 text-white px-4 py-2 rounded-r-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Send
            </button>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 mt-10">Select a contact to start chatting</p>
      )}
    </div>
  )
}

export default ChatWindow

