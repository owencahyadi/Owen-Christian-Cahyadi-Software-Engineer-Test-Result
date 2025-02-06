let isResizing = false;  
let isDragging = false;  

let clipsData = [];  

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function addClip() {
    const label = document.getElementById('clipLabel').value;
    const duration = parseInt(document.getElementById('clipDuration').value);

    if (!label || !duration) {
        alert('Please fill in both label and duration!');
        return;
    }

    const clipsWrapper = document.getElementById('clipsWrapper');

    const clipId = 'clip-' + new Date().getTime();

    const clip = document.createElement('div');
    clip.classList.add('clip');
    clip.dataset.id = clipId;

    const clipColor = getRandomColor();
    clip.style.backgroundColor = clipColor;

    clip.style.width = (duration * 10) + 'px';
    clip.dataset.label = label;
    clip.setAttribute('draggable', 'true');
    clip.addEventListener('dragstart', onDragStart);
    clip.addEventListener('dragover', onDragOver);
    clip.addEventListener('drop', onDrop);
    clip.addEventListener('dragend', onDragEnd);

    const textSpan = document.createElement('span');
    textSpan.classList.add('clip-text');
    textSpan.textContent = `${label} - ${duration}s`;

    const leftHandle = document.createElement('div');
    const rightHandle = document.createElement('div');
    leftHandle.classList.add('resize-handle', 'left');
    rightHandle.classList.add('resize-handle', 'right');

    leftHandle.style.backgroundColor = clipColor;
    rightHandle.style.backgroundColor = clipColor;

    clip.appendChild(textSpan);
    clip.appendChild(leftHandle);
    clip.appendChild(rightHandle);

    leftHandle.addEventListener('mousedown', onResizeStart);
    rightHandle.addEventListener('mousedown', onResizeStart);

    clipsWrapper.appendChild(clip);

    clipsData.push({
        id: clipId,
        label: label,
        start: 0, 
        duration: duration
    });

    console.log(clipsData);

    document.getElementById('clipLabel').value = '';
    document.getElementById('clipDuration').value = '';

    closeModal();
}

function onDragStart(event) {
    if (isResizing) {
        event.preventDefault();  
        return;
    }

    isDragging = true;
    draggedClip = event.target;
    setTimeout(() => {
        event.target.style.opacity = '0';
    }, 0);
}

function onDragOver(event) {
    event.preventDefault();
}

function onDrop(event) {
    event.preventDefault();

    if (isResizing) {
        event.preventDefault(); 
        return;
    }

    if (event.target.classList.contains('clip') && event.target !== draggedClip) {
        const clipsWrapper = document.getElementById('clipsWrapper');
        const allClips = Array.from(clipsWrapper.children);

        const draggedIndex = allClips.indexOf(draggedClip);
        const targetIndex = allClips.indexOf(event.target);

        if (draggedIndex < targetIndex) {
            clipsWrapper.insertBefore(draggedClip, event.target.nextSibling);
        } else {
            clipsWrapper.insertBefore(draggedClip, event.target);
        }

        const start = Math.floor(draggedClip.offsetLeft / 10);
        const duration = Math.floor(draggedClip.offsetWidth / 10);

        const clipIndex = clipsData.findIndex(c => c.id === draggedClip.dataset.id);
        if (clipIndex !== -1) {
            clipsData[clipIndex].start = start;
            clipsData[clipIndex].duration = duration;
        }

        const clipMovedEvent = new CustomEvent('clipMoved', {
            detail: {
                id: draggedClip.dataset.id,
                start: start,
                label: draggedClip.dataset.label,
                duration: duration
            }
        });
        document.dispatchEvent(clipMovedEvent);
    }
}

function onDragEnd(event) {
    event.target.style.opacity = '1';
    isDragging = false;
    draggedClip = null;
}

function onResizeStart(event) {
    if (isDragging) {
        event.preventDefault();  
        return;
    }

    isResizing = true;
    event.stopPropagation();
    resizingClip = event.target.parentElement;
    resizingSide = event.target.classList.contains('left') ? 'left' : 'right';

    startX = event.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(resizingClip).width, 10);

    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', onResizeEnd);
}

function onResize(event) {
    if (!resizingClip) return;

    let newWidth = startWidth + (resizingSide === 'right' ? event.clientX - startX : startX - event.clientX);
    newWidth = Math.max(50, newWidth);
    let newDuration = Math.floor(newWidth / 10);

    resizingClip.style.width = `${newWidth}px`;
    let textNode = resizingClip.querySelector('.clip-text');
    if (textNode) {
        textNode.textContent = `${resizingClip.dataset.label} - ${newDuration}s`;
    }

    const clipIndex = clipsData.findIndex(c => c.id === resizingClip.dataset.id);
    if (clipIndex !== -1) {
        clipsData[clipIndex].duration = newDuration;
    }
}

function onResizeEnd() {
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', onResizeEnd);

    if (!resizingClip) return;

    const clipId = resizingClip.dataset.id;

    const clipResizedEvent = new CustomEvent('clipResized', {
        detail: {
            id: clipId,
            label: clipsData.find(c => c.id === clipId).label,
            duration: clipsData.find(c => c.id === clipId).duration
        }
    });
    document.dispatchEvent(clipResizedEvent);

    isResizing = false;
    resizingClip = null;
}

document.addEventListener('clipMoved', (event) => {
    const { id, start, label, duration } = event.detail;
    console.log(`Clip Moved: ID: ${id}, Start: ${start}, Label: ${label}, Duration: ${duration}s`);
});

document.addEventListener('clipResized', (event) => {
    const { id, label, duration } = event.detail;
    console.log(`Clip Resized: ID: ${id}, Label: ${label}, Duration: ${duration}s`);
});

function scrollHorizontal(e) {
    e.preventDefault();
    
    e = window.event || e;
    
    let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    
    document.querySelector('#clipsWrapper').scrollLeft -= (delta * 40);
}

if (document.querySelector('#clipsWrapper')) {
    document.querySelector('#clipsWrapper').addEventListener('mousewheel', scrollHorizontal, false);
    document.querySelector('#clipsWrapper').addEventListener('DOMMouseScroll', scrollHorizontal, false);
}

const addClipModal = document.querySelector('.add-clip');
const modalOverlay = document.getElementById('modalOverlay');

const addButton = document.querySelector('.add');

function showModal() {
    addClipModal.style.display = 'block';  
    modalOverlay.style.display = 'block';  
}

function closeModal() {
    addClipModal.style.display = 'none';  
    modalOverlay.style.display = 'none';  
}

addButton.addEventListener('click', showModal);

modalOverlay.addEventListener('click', closeModal);
