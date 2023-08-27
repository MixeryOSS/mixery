# Nodes
This new Mixery rewrite now choose a brand new way to make music: using nodes system. This is
because Web Audio API is based on nodes system, so it's unwise for Mixery to not use nodes as well.

## Nodes introduction
The concept of nodes is pretty simple: you connect the output of the node to an input of another
node.

## Default nodes
### Inputs
- Live MIDI Input: Live MIDI data from your MIDI controller. Including sliders and note events.
    + Controller (`<unspecified>`): The controller to listen for events.
    + Slider Channel (`number`): The slider number to use.
    + `out` Note Signal (`mixery:midi`): The MIDI note signal.
    + `out` Slider Value (`mixery:audio_parameter`): The slider value, which can be attached to
      audio parameters.
- Note Clip: MIDI note events data from note clips that are placed on playlist. Note clips are clips
that you made from piano roll.
    + Channel (`string`): Clip channel.
    + `out` Note Signal (`mixery:midi`): The MIDI note signal.
- Audio Clip: Audio signals from audio clips that are placed on playlist.
    + Channel (`string`): Clip channel.
    + `out` Audio Signal (`mixery:audio_signal`): The audio signal.

### Outputs
- Destination: Send audio signal to your playback device.
    + `in` Audio Signal (`mixery:audio_signal`): The audio signal.