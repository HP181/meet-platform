"use client"
import type React from "react"
import { useEffect, useState } from "react"

export interface FAQ{
    _id: string
    question: string,
    answer: string
}

const FAQs = () => {
  const [data, setData] = useState<FAQ[]>([])
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null)
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/faq")
      const result = await response.json()
      setData(result)
    }

    fetchData()
  }, [])

  const handleEdit = (faq: FAQ) => {
    setSelectedFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
    })
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setSelectedFaq(null)
    setFormData({
      question: "",
      answer: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && selectedFaq) {
      try {
        const response = await fetch(`/api/faq`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _id: selectedFaq._id,
            question: formData.question,
            answer: formData.answer,
          }),
        })

        if (response.ok) {
          setData((prev) =>
            prev.map((faq) =>
              faq._id === selectedFaq._id ? { ...faq, question: formData.question, answer: formData.answer } : faq,
            ),
          )
          cancelEdit()
        }
      } catch (error) {
        console.error("Error updating FAQ:", error)
      }
    } else {
      try {
        const response = await fetch("/api/faq", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const newFaq = await response.json()
          setData((prev) => [...prev, newFaq])
          setFormData({
            question: "",
            answer: "",
          })
        }
      } catch (error) {
        console.error("Error adding FAQ:", error)
      }
    }
  }

  const handleDelete = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return
    }

    try {
      const response = await fetch("/api/faq", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: faqId }),
      })

      if (response.ok) {
        setData((prev) => prev.filter((faq) => faq._id !== faqId))
        if (selectedFaq && selectedFaq._id === faqId) {
          cancelEdit()
        }
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error)
    }
  }

  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <h1 className="text-3xl font-bold">FAQs</h1>

      

      {data.map((q) => (
        <div
          className={`mb-10 p-4 rounded-lg transition-colors bg-gray-900 border ${
            isEditing && selectedFaq?._id === q._id ? "border-blue-500 bg-blue-900/20" : "border-gray-700"
          }`}
          key={q._id}
        >
          <div className="flex justify-between items-start">
            <div
              className="flex-1 cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors"
            >
              <h3 className="flex items-center mb-4 text-lg font-medium text-white">
                <svg
                  className="flex-shrink-0 mr-2 w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                {q.question}
                {isEditing && selectedFaq?._id === q._id && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded">Editing</span>
                )}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">{q.answer}</p>
            </div>
            
          </div>
        </div>
      ))}
    </section>
  )
}

export default FAQs