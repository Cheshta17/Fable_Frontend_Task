class ImgAnnotator {
    constructor() {
        this.imgUpload = document.getElementById('imgUpload');
        this.uploadedImg = document.getElementById('uploadedImg');
        this.imageContainer = document.getElementById('imageContainer');
        this.tooltipContainer = document.getElementById('tooltipContainer');
        this.saveButton = document.getElementById('saveButton');
        this.tooltips = [];
        this.isDragging = false;
        this.draggedTooltip = null;
        this.uploadedImg.style.display = 'none';
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.imgUpload.addEventListener('change', (e) => this.handleimgUpload(e));
        this.uploadedImg.addEventListener('click', (e) => this.handleImgClick(e));
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', () => this.handleDragEnd());
        this.saveButton.addEventListener('click', () => this.saveAnnotatedimg());
    }

    handleimgUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.uploadedImg.src = e.target.result;
                    this.uploadedImg.style.display = 'block';
                    this.tooltips = [];
                    this.tooltipContainer.innerHTML = '';
                    this.saveButton.style.display = 'block';
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    getCoordinates(event) {
        const rect = this.uploadedImg.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(event.clientX - rect.left, rect.width)),
            y: Math.max(0, Math.min(event.clientY - rect.top, rect.height))
        };
    }

    handleImgClick(event) {
        if (!this.isDragging && this.uploadedImg.style.display !== 'none') {
            const { x, y } = this.getCoordinates(event);
            const text = prompt('Enter tooltip text:');
            if (text) {
                this.createTooltip(x, y, text);
            }
        }
    }

    createTooltip(x, y, text) {
        const tooltip = {
            id: Date.now(),
            x,
            y,
            text
        };
        this.tooltips.push(tooltip);
        this.renderTooltip(tooltip);
    }

    renderTooltip(tooltip) {
        const tooltipElem = document.createElement('div');
        tooltipElem.className = 'tooltip';
        tooltipElem.setAttribute('data-id', tooltip.id);
        tooltipElem.style.left = `${tooltip.x}px`;
        tooltipElem.style.top = `${tooltip.y}px`;
        const editIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>`;
        const delIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>`;
        tooltipElem.innerHTML = `
            <div class="tooltip-cross"></div>
            <div class="tooltip-content">
                <div class="tooltip-text">${tooltip.text}</div>
                <div class="tooltip-actions">
                    <button class="tooltip-button edit-button" title="Edit">${editIcon}</button>
                    <button class="tooltip-button del-button" title="Delete">${delIcon}</button>
                </div>
            </div>
        `;
        const cross = tooltipElem.querySelector('.tooltip-cross');
        const editButton = tooltipElem.querySelector('.edit-button');
        const delButton = tooltipElem.querySelector('.del-button');
        cross.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.handleDragSt(e, tooltip);
        });
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleTooltipEdit(tooltip);
        });
        delButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleTooltipDel(tooltip);
        });
        this.tooltipContainer.appendChild(tooltipElem);
    }

    handleTooltipEdit(tooltip) {
        const newTxt = prompt('Edit tooltip text:', tooltip.text);
        if (newTxt !== null && newTxt !== '') {
            tooltip.text = newTxt;
            const tooltipElem = this.tooltipContainer.querySelector(`[data-id="${tooltip.id}"]`);
            tooltipElem.querySelector('.tooltip-text').textContent = newTxt;
        }
    }

    handleTooltipDel(tooltip) {
        this.tooltips = this.tooltips.filter(t => t.id !== tooltip.id);
        const tooltipElem = this.tooltipContainer.querySelector(`[data-id="${tooltip.id}"]`);
        if (tooltipElem) {
            tooltipElem.remove();
        }
    }

    handleDragSt(event, tooltip) {
        event.stopPropagation();
        this.isDragging = true;
        this.draggedTooltip = tooltip;
    }

    handleDrag(event) {
        if (this.isDragging && this.draggedTooltip) {
            event.preventDefault();
            const { x, y } = this.getCoordinates(event);
            this.draggedTooltip.x = x;
            this.draggedTooltip.y = y;
            const tooltipElem = this.tooltipContainer.querySelector(
                `[data-id="${this.draggedTooltip.id}"]`
            );
            if (tooltipElem) {
                tooltipElem.style.left = `${x}px`;
                tooltipElem.style.top = `${y}px`;
            }
        }
    }

    handleDragEnd() {
        this.isDragging = false;
        this.draggedTooltip = null;
    }

    async saveAnnotatedimg() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.uploadedImg.naturalWidth;
        canvas.height = this.uploadedImg.naturalHeight;
        ctx.drawImage(this.uploadedImg, 0, 0);
        const scaleX = canvas.width / this.uploadedImg.clientWidth;
        const scaleY = canvas.height / this.uploadedImg.clientHeight;
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        this.tooltips.forEach(tooltip => {
            const x = tooltip.x * scaleX;
            const y = tooltip.y * scaleY;  
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;

            const textMetrics = ctx.measureText(tooltip.text);
            const padding = 5;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                x + 15,
                y - 20,
                textMetrics.width + padding * 2,
                24
            );
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(tooltip.text, x + 15 + padding, y);
        });

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const url = window.URL.createObjectURL(blob);
            const lnk = document.createElement('a');
            lnk.href = url;
            lnk.download = 'annotated-image.png';
            document.body.appendChild(lnk);
            lnk.click();
            document.body.removeChild(lnk);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error saving image:', error);
            alert('An error occurred while saving the image. Please try again.');
        }
    }
}
