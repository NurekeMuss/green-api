import { useState } from "react"

interface Contact {
  id: string
  name: string
  contactName: string
  type: "user" | "group"
  lastMessage?: string
  unreadCount?: number
  hasNewMessage?: boolean
}

interface ContactListProps {
  contacts: Contact[]
  onSelectContact: (contact: Contact) => void
  selectedContact: Contact | null
}

function ContactList({ contacts, onSelectContact, selectedContact }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase()
    const name = (contact.name || contact.contactName || "").toLowerCase()
    const phoneNumber = contact.id.split("@")[0].toLowerCase()
    return name.includes(searchLower) || phoneNumber.includes(searchLower)
  })

  return (
    <div className="w-1/4 bg-white border-r border-gray-300 flex flex-col">
      <h2 className="text-2xl font-bold p-4 bg-gray-200">Contacts</h2>
      <div className="p-4">
        <input
          type="text"
          placeholder="Search by name or number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <ul className="flex-1 overflow-y-auto">
        {filteredContacts.map((contact) => (
          <li
            key={contact.id}
            onClick={() => {
              onSelectContact(contact)
              // Reset the hasNewMessage flag when the contact is selected
              contact.hasNewMessage = false
            }}
            className={`p-4 hover:bg-gray-100 cursor-pointer border-b border-gray-200 ${
              selectedContact?.id === contact.id ? "bg-gray-200" : ""
            } ${contact.hasNewMessage ? "bg-green-100" : ""}`}
          >
            <div className="flex justify-between items-center">
              <span className={contact.hasNewMessage ? "font-bold" : ""}>
                {contact.name || contact.contactName || "Unknown"}
              </span>
              {contact.unreadCount && contact.unreadCount > 0 && (
                <span className="bg-green-500 text-white rounded-full px-2 py-1 text-xs">{contact.unreadCount}</span>
              )}
            </div>
            {contact.lastMessage && (
              <p
                className={`text-sm ${contact.hasNewMessage ? "text-green-600 font-semibold" : "text-gray-600"} truncate`}
              >
                {contact.lastMessage}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ContactList

