import { ref, computed, onMounted, onUnmounted } from 'vue'

// Shared state for quotes across all pages
const quotes = [
    { text: "Connectivity is not just about linking devices; it's about empowering ecosystems.", author: "Enterprise Solutions" },
    { text: "The future of IoT lies in seamless, secure, and intelligent connections.", author: "IoTNet Vision" },
    { text: "Transform data into decisions. Transform devices into intelligence.", author: "Smart Infrastructure" },
    { text: "One platform. Millions of devices. Infinite possibilities.", author: "IoTNet Platform" },
    { text: "Security and scalability at the core of every connection.", author: "Enterprise IoT" },
]

// Shared reactive index (singleton pattern)
const currentQuoteIndex = ref(0)
let intervalId = null
let instanceCount = 0

export function useQuotes() {
    const currentQuote = computed(() => quotes[currentQuoteIndex.value])

    onMounted(() => {
        instanceCount++
        // Only start interval if this is the first instance
        if (instanceCount === 1) {
            intervalId = setInterval(() => {
                currentQuoteIndex.value = (currentQuoteIndex.value + 1) % quotes.length
            }, 5000)
        }
    })

    onUnmounted(() => {
        instanceCount--
        // Only clear interval if this is the last instance
        if (instanceCount === 0 && intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
    })

    return {
        currentQuote,
        quotes
    }
}
