// js/utils/uiConstants.js

/**
 * UI color constants for pipeline stages and hazards
 */
export const UI_COLORS = {
    PIPELINE_STAGES: {
        'Fetch': 'bg-blue-100',
        'Decode': 'bg-green-100',
        'Execute': 'bg-yellow-100',
        'Memory': 'bg-pink-100',
        'Writeback': 'bg-purple-100',
        'Stall': 'bg-gray-100'
    },
    HAZARDS: {
        'RAW': 'bg-red-100 text-red-800',
        'WAW': 'bg-yellow-100 text-yellow-800',
        'Structural': 'bg-purple-100 text-purple-800'
    },
    FORWARDING: 'text-blue-600',
    HAZARD_HEADING: 'text-red-600'
};

/**
 * Icons for different pipeline states
 */
export const UI_ICONS = {
    HAZARD: '<svg class="w-4 h-4 text-red-500" viewBox="0 0 24 24"><path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>',
    FORWARDING: '<svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24"><path fill="currentColor" d="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z" /></svg>',
    INFO: '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>'
};

/**
 * CSS classes for common UI components
 */
export const CSS_CLASSES = {
    CARD: 'card mb-4 overflow-x-auto',
    CARD_CONTENT: 'p-6',
    TITLE: 'text-xl font-bold mb-4 flex items-center gap-2',
    BADGE: {
        FORWARDING: 'ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'
    },
    TOOLTIP: 'tooltip hidden group-hover:block absolute z-10 -top-full left-1/2 -translate-x-1/2 p-2 bg-white shadow-lg rounded border text-xs'
};