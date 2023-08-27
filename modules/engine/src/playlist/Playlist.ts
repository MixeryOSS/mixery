import { Clip } from "./Clip.js";

export interface Playlist {
    tracks: PlaylistTrack[];
}

export interface PlaylistTrack {
    /**
     * Color of this track.
     */
    trackColor?: `#${string}`;

    /**
     * Name of this track.
     */
    trackName?: string;

    /**
     * The height of this track. Default height is 50 pixels.
     */
    trackHeight: number;

    /**
     * Track mute state.
     */
    isMuted: boolean;

    /**
     * An array of clips in this playlist track.
     */
    clips: Clip[];
}