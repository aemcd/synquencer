import hotkeys from 'hotkeys-js';
            function hotKeys() {
hotkeys('a, b, c, d, e, f, g', function(event, handler){
  // Prevent the default refresh event under WINDOWS system
  event.preventDefault()
  alert(handler.key + 'created');
});
hotkeys('up, down', function(event, handler){
    // Prevent the default refresh event under WINDOWS system
    event.preventDefault()
    alert('Move note' + handler.key + 'a semitone');
});
hotkeys('ctrl + up, ctrl + down', function(event, handler){
    // Prevent the default refresh event under WINDOWS system
    event.preventDefault()
    alert('Move note' + handler.key + 'an octave');
});
hotkeys('1, 2, 3, 4, 5', function(event, handler){
 switch(handler.key) {
    case '1': alert('Note duration set to 1/16.');
    break;
    case '2': alert('Note duration set to 1/8.');
    break;
    case '3': alert('Note duration set to 1/4.');
    break;
    case '4': alert('Note duration set to 1/2.');
    break;
    case '5': alert('Note duration set to 1/1.');
    break;
    default: alert(event);
 } });
 hotkeys('left, right, ctrl+left, ctrl+right', function(event, handler){
    switch(handler.key) {
       case 'left': alert('Moved cursor left.');
       break;
       case 'right': alert('moved right.');
       break;
       case 'ctrl+left': alert('Moved note left.');
       break;
       case 'ctrl+right': alert('moved note right.');
       break;
    default: alert(event);
    }
});
hotkeys('ctrl+n, command+n', function(event, handler){
    // Prevent the default refresh event under WINDOWS system
    event.preventDefault()
    alert('Create a new sequence:');
});
hotkeys('shift + up, shift + down', function(event, handler){
    // Prevent the default refresh event under WINDOWS system
    event.preventDefault()
    alert('changed velocity' + handler.key);
});
hotkeys('del', function(event, handler){
    // Prevent the default refresh event under WINDOWS system
    event.preventDefault()
    alert('Note deleted' + handler.key);
});

}