<script setup lang="ts">
type IconType = string;

const props = defineProps<{
    type: IconType;
}>();
</script>

<template>
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'mixery'">
        <path d="M12.5 5V20" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 7H11.5V10H10C9.5 10 8.5 9.7 8.5 8.5C8.5 7.3 9.5 7 10 7Z" fill="currentColor"/>
        <path d="M14 18H13.5V15H14C14.5 15 15.5 15.3 15.5 16.5C15.5 17.7 14.5 18 14 18Z" fill="currentColor"/>
        <path d="M8.5 11H11.5V14H8.5C8 14 7 13.7 7 12.5C7 11.3 8 11 8.5 11Z" fill="currentColor"/>
        <path d="M6.5 15H11.5V18H6.5C6 18 5 17.7 5 16.5C5 15.3 6 15 6.5 15Z" fill="currentColor"/>
        <path d="M16.5 7.5H14V9.5H16.5C16.8333 9.5 17.5 9.3 17.5 8.5C17.5 7.7 16.8333 7.5 16.5 7.5Z" stroke="currentColor"/>
        <path d="M18.5 11.5H14V13.5H18.5C18.8333 13.5 19.5 13.3 19.5 12.5C19.5 11.7 18.8333 11.5 18.5 11.5Z" stroke="currentColor"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'close'">
        <path d="M5 5L20 20" stroke="currentColor" stroke-linecap="round"/>
        <path d="M20 5L5 20" stroke="currentColor" stroke-linecap="round"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'menu'">
        <path d="M5 12.5H12.5H20" stroke="currentColor" stroke-linecap="round"/>
        <path d="M5 5H12.5H20" stroke="currentColor" stroke-linecap="round"/>
        <path d="M5 20H12.5H20" stroke="currentColor" stroke-linecap="round"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'add'">
        <path d="M5 12.5H12.5M12.5 12.5V5M12.5 12.5H20M12.5 12.5V20" stroke="currentColor" stroke-linecap="round"/>
    </svg>

    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="props.type == 'metronome-left'">
        <path d="M15 5H10L8 20H17L15 5Z" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M12.5 7V14" stroke="currentColor" stroke-linecap="currentColor"/>
        <path d="M5.35355 9.95644L12.4246 17.0275" stroke="currentColor" stroke-linecap="round"/>
        <path d="M6.06065 9.95644L5.35355 10.6636L6.06065 11.3707H6.76776V10.6636L6.06065 9.95644Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12.5" cy="17" r="1" fill="currentColor"/>
    </svg>
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="props.type == 'metronome-middle'">
        <path d="M15 5H10L8 20H17L15 5Z" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M12.5 7V14" stroke="currentColor" stroke-linecap="round"/>
        <path d="M12.5 7L12.5 17" stroke="currentColor" stroke-linecap="round"/>
        <path d="M12 7.5H13V8.5L12.5 9L12 8.5V7.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12.5" cy="17" r="1" fill="currentColor"/>
    </svg>
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="props.type == 'metronome-right'">
        <path d="M15 5H10L8 20H17L15 5Z" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M12.5 7V14" stroke="currentColor" stroke-linecap="round"/>
        <path d="M19.6465 9.95644L12.5754 17.0275" stroke="currentColor" stroke-linecap="round"/>
        <path d="M18.9393 9.95644L19.6465 10.6636L18.9393 11.3707H18.2322V10.6636L18.9393 9.95644Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12.5" cy="17" r="1" fill="currentColor"/>
    </svg>
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="props.type == 'folder-close'">
        <path d="M5 10C5 8.4 6.33333 8 7 8C7.30172 8 7.63784 8 8 8M5 10C5 11.6 5 15.6667 5 18C5 18.6667 5.4 20 7 20C8.6 20 15 20 18 20C18.6667 20 20 19.6 20 18C20 16.4 20 12.3333 20 10C20 9.33333 19.6 8 18 8C17.5957 8 16.8849 8 16 8M5 10V7C5 6.33333 5.4 5 7 5H10M16 8V7C16 5.4 14.6667 5 14 5H10M16 8C13.735 8 10.3289 8 8 8M8 8V7C8 6.33333 8.4 5 10 5" stroke="currentColor"/>
    </svg>
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="props.type == 'folder-open'">
        <path d="M7 20C5.4 20 5 18.6667 5 18C5 15.6667 5 11.6 5 10M7 20C8.6 20 15 20 18 20M7 20H18M18 20C18.6667 20 19.5 19.5 20 18M5 10C5 8.4 6.33333 8 7 8C7.30172 8 7.63784 8 8 8V7C8 6.33333 8.4 5 10 5M5 10V7C5 6.33333 5.4 5 7 5H10M10 5H14C14.6667 5 16 5.4 16 7V7.5C16.8849 7.5 17.5957 7.5 18 7.5C18.4973 7.5 19.3657 7.72262 19.7747 8.5" stroke="currentColor"/>
        <path d="M7 20C5.4 20 5 18.6667 5 18C5.5 16 6.5 12 7 10.5C7.50596 8.98211 8.83333 8.5 9.5 8.5H20.5C22.1 8.5 22 9.83333 22 10.5C21.5 13 20.5 17 20 18C19.2845 19.4311 18.6667 20 18 20M7 20C8.6 20 15 20 18 20M7 20H18" stroke="currentColor"/>
    </svg>

    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="props.type == 'play'">
        <path d="M17.0781 11.7318L10.6402 5.23176C9.98886 4.68899 9 5.15214 9 5.99998V19C9 19.8479 9.98886 20.311 10.6402 19.7682L17.0781 13.2682C17.5579 12.8684 17.5579 12.1316 17.0781 11.7318Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="props.type == 'pause'">
        <path d="M9 5V20" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 5V20" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="props.type == 'stop'">
        <path d="M18 5H7C5.89543 5 5 5.89543 5 7V18C5 19.1046 5.89543 20 7 20H18C19.1046 20 20 19.1046 20 18V7C20 5.89543 19.1046 5 18 5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'piano'">
        <path d="M17 11.5V5H18C19.6 5 20 6.33333 20 7V18C20 19.6 18.6667 20 18 20H15.5V13C16.7 13 17 12 17 11.5Z" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M8 11.5V5H11V11.5C11 12 10.7 13 9.5 13C8.3 13 8 12 8 11.5Z" fill="currentColor" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M14 11.5V5H17V11.5C17 12 16.7 13 15.5 13C14.3 13 14 12 14 11.5Z" fill="currentColor" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M11 11.5V5H14V11.5C14 12.7 15 13 15.5 13V20H9.5V13C10.7 13 11 12 11 11.5Z" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M7 5H8V11.5C8 12.7 9 13 9.5 13V20H7C5.4 20 5 18.6667 5 18V7C5 5.4 6.33333 5 7 5Z" stroke="currentColor" stroke-linejoin="round"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'pattern'">
        <path d="M5 20V5H8V20H5Z" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M18 5H8V20H18C19.6 20 20 18.6667 20 18V7C20 5.4 18.6667 5 18 5Z" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M10 7H11" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13 9H14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11H14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 13H14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 15H14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 13H18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 15H18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 17H18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 7H17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'nodes'">
        <path d="M7 5C5.4 5 5 6.33333 5 7V10C5 11.6 6.33333 12 7 12H9C10.6 12 11 10.6667 11 10V7C11 5.4 9.66667 5 9 5H7Z" stroke="currentColor"/>
        <path d="M11 16C9.4 16 9 17.3333 9 18C9 19.6 10.3333 20 11 20H13C14.6 20 15 18.6667 15 18C15 16.4 13.6667 16 13 16H11Z" stroke="currentColor"/>
        <path d="M16 7C14.4 7 14 8.33333 14 9V11C14 12.6 15.3333 13 16 13H18C19.6 13 20 11.6667 20 11V9C20 7.4 18.6667 7 18 7H16Z" stroke="currentColor"/>
        <path d="M7 12V16C7 16.6667 7.4 18 9 18" stroke="currentColor"/>
        <path d="M11 9H14" stroke="currentColor"/>
        <path d="M12 16V13C12 12.3333 12.4 11 14 11" stroke="currentColor"/>
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'pen'">
        <path d="M7 16L5 20L9 18L7 16Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10.5 16.5L8.5 14.5L18 5L19 6L20 7L10.5 16.5Z" fill="currentColor" stroke="currentColor" stroke-linejoin="round"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'brush'">
        <path d="M9 18L7 16L4 17L3 18L7 22L8 21L9 18Z" fill="currentColor" stroke="currentColor" stroke-linejoin="round"/>
        <path d="M10.5 16.5L8.5 14.5C9.35844 12.6583 9.59214 11.6648 12.5 9.5C14.0631 8.34847 14.5 8 17 7L19 6.5L21 6C18.4684 8.77795 16 9.5 15 12C14 14.5 12.4161 15.9313 10.5 16.5Z" fill="currentColor" stroke="currentColor" stroke-linejoin="round"/>
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'resizer'">
        <path d="M11 4V12M11 20V12M11 12H4M4 12L7 9M4 12L7 15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 4V12M14 20V12M14 12H21M21 12L18 9M21 12L18 15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'delete'">
        <path d="M17.4497 7.55025L7.55023 17.4497M7.5 17.5L17.5 7.5M17.8033 17.8033C14.8743 20.7322 10.1256 20.7322 7.19667 17.8033C4.26774 14.8744 4.26774 10.1256 7.19667 7.1967C10.1256 4.26777 14.8743 4.26777 17.8033 7.1967C20.7322 10.1256 20.7322 14.8744 17.8033 17.8033Z" stroke="currentColor"/>
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" v-if="props.type == 'speaker-0'">
        <path d="M8 15.5V9.5H14L16 7V18L14 15.5H8Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 20L20 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
</template>