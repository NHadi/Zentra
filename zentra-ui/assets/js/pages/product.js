import { zentra } from '../api/index.js';
import { getBaseUrl } from '../api/config.js';

// Define ProductPage
window.ProductPage = class {
    constructor() {
        this.grid = null;
        this.selectedCategory = null;
        this.currentProduct = null;
        this.allCategories = [];
        this.categoryFilter = '';
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
            .text(`
                /* Image Preview Grid */
                .image-preview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 0.75rem;
                    padding: 0.75rem;
                }

                /* Image Preview Container */
                .image-preview {
                    position: relative;
                    border-radius: 6px;
                    overflow: hidden;
                    background: #f8f9fa;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    aspect-ratio: 1;
                    width: 100%;
                    max-width: 100px;
                    margin: 0 auto;
                }

                .image-preview:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                /* Image Wrapper */
                .image-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: #f8f9fa;
                }

                .image-wrapper img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .image-wrapper img.loaded {
                    opacity: 1;
                }

                /* Overlay Buttons */
                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .image-preview:hover .image-overlay {
                    opacity: 1;
                }

                .overlay-buttons {
                    display: flex;
                    gap: 0.25rem;
                }

                .btn-action {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: none;
                    background: white;
                    color: #5e72e4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    transform: translateY(5px);
                    opacity: 0;
                    font-size: 12px;
                }

                .image-preview:hover .btn-action {
                    transform: translateY(0);
                    opacity: 1;
                }

                .btn-action:hover {
                    background: #5e72e4;
                    color: white;
                    transform: translateY(-1px) !important;
                }

                .btn-action.delete-btn:hover {
                    background: #dc3545;
                }

                /* Loading Spinner */
                .loading-spinner {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255,255,255,0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 1;
                    transition: opacity 0.2s ease;
                }

                .loading-spinner .spinner-border {
                    width: 1.5rem;
                    height: 1.5rem;
                    border-width: 0.15em;
                }

                .image-preview.uploading .loading-spinner {
                    opacity: 1;
                }

                .image-preview:not(.uploading) .loading-spinner {
                    display: none;
                }

                /* No Images Placeholder */
                .no-images-placeholder {
                    text-align: center;
                    padding: 1.5rem;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 2px dashed #dee2e6;
                    color: #6c757d;
                    margin: 0.75rem;
                }

                .no-images-placeholder i {
                    font-size: 1.5rem;
                    color: #adb5bd;
                    margin-bottom: 0.75rem;
                }

                /* Product Grid Thumbnail */
                .product-thumbnail {
                    width: 40px;
                    height: 40px;
                    border-radius: 4px;
                    overflow: hidden;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease;
                }

                .product-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                /* Image Preview Modal */
                #imagePreviewModal {
                    z-index: 2000; /* Higher than DevExpress popup z-index */
                }

                #imagePreviewModal .modal-dialog {
                    max-width: 600px;
                }

                #imagePreviewModal .modal-content {
                    background: transparent;
                    border: none;
                    box-shadow: none;
                }

                #imagePreviewModal .modal-body {
                    padding: 0;
                    background: #f8f9fa;
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                }

                #imagePreviewModal .modal-body img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                }

                #imagePreviewModal .modal-header {
                    position: absolute;
                    top: 0;
                    right: 0;
                    z-index: 2001;
                    border: none;
                    background: transparent;
                }

                #imagePreviewModal .close {
                    color: white;
                    text-shadow: 0 0 3px rgba(0,0,0,0.5);
                    opacity: 0.8;
                    font-size: 28px;
                    padding: 0.5rem;
                }

                #imagePreviewModal .close:hover {
                    opacity: 1;
                }
            `)
            .appendTo('head');
    }

    dispose() {
        // Clean up event listeners
        $('#categoryModal').off('show.bs.modal');
        $('#categoryModal').off('hide.bs.modal');
        $('#categorySearchBox').off('input');
        $('#saveCategory').off('click');

        // Dispose of the grid
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
    }

    bindEvents() {
        // Modal show event
        $('#categoryModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const productId = button.data('product-id');
            const productName = button.data('product-name');
            this.currentProduct = { id: productId, name: productName };
            this.loadCategories(productId);
        });

        // Modal hide event
        $('#categoryModal').on('hide.bs.modal', () => {
            this.selectedCategory = null;
            this.categoryFilter = '';
            $('#categorySearchBox').val('');
            $('.category-list').empty();
        });

        // Category search
        $('#categorySearchBox').on('input', (e) => {
            this.categoryFilter = e.target.value.toLowerCase();
            this.renderCategories();
        });

        // Save category
        $('#saveCategory').on('click', () => this.saveCategory());
    }

    initialize() {
        // Load categories first and wait for them to be loaded
        this.loadCategories().then(() => {
            // Initialize grid after categories are loaded
            this.initializeGrid();
            // Load data after grid is initialized
            this.loadData();
        }).catch(error => {
            console.error('Failed to initialize categories:', error);
            DevExpress.ui.notify('Failed to load categories. Please refresh the page.', 'error', 5000);
        });
    }

    async loadCategories(productId) {
        try {
            const categories = await zentra.getCategories();
            console.log('Categories loaded:', categories);
            this.allCategories = categories;
            return categories;
        } catch (error) {
            console.error('Error loading categories:', error);
            DevExpress.ui.notify('Failed to load categories', 'error', 3000);
            throw error;
        }
    }

    initializeGrid() {
        const gridElement = $('#productGrid');
        if (!gridElement.length) {
            console.error('Product grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        // Create a simple array for the category lookup
        const categoryLookup = this.allCategories.map(cat => ({
            id: cat.id,
            name: cat.name
        }));

        this.grid = $('#productGrid').dxDataGrid({
            dataSource: {
                store: {
                    type: 'array',
                    key: 'id',
                    data: []
                }
            },
            remoteOperations: false,
            columns: [
                {
                    dataField: 'name',
                    caption: 'Product Name',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        const $container = $('<div>')
                            .addClass('d-flex align-items-center');

                        // Add product image thumbnail if available
                        if (options.data.images && options.data.images.length > 0) {
                            const image = options.data.images[0];
                            const imageUrl = image.url || image.image_url;
                            const fullImageUrl = imageUrl.startsWith('http') || imageUrl.startsWith(getBaseUrl())
                                ? imageUrl
                                : `${getBaseUrl()}${imageUrl}`;

                            $('<div>')
                                .addClass('product-thumbnail mr-3')
                                .append(
                                    $('<img>')
                                        .attr('src', fullImageUrl)
                                        .attr('alt', options.data.name)
                                        .addClass('img-fluid rounded')
                                )
                                .appendTo($container);
                        } else {
                            $('<div>')
                                .addClass('product-thumbnail mr-3')
                                .append(
                                    $('<div>')
                                        .addClass('no-image-placeholder')
                                        .append($('<i>').addClass('fas fa-tshirt'))
                                )
                                .appendTo($container);
                        }

                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                            )
                            .append(
                                $('<small>').addClass('text-muted').text(options.data.code || '')
                            )
                            .appendTo($container);

                        container.append($container);
                    }
                },
                {
                    dataField: 'category',
                    caption: 'Category',
                    allowFiltering: false,
                    allowSorting: false,
                    cellTemplate: (container, options) => {
                        const $container = $('<div>').addClass('product-container');
                        
                        if (options.data.category) {
                            $('<span>')
                                .addClass('product-badge')
                                .append(
                                    $('<i>').addClass('fas fa-tag')
                                )
                                .append(
                                    $('<span>').text(' ' + options.data.category.name)
                                )
                                .appendTo($container);
                        } else {
                            $('<div>')
                                .addClass('text-muted small')
                                .append(
                                    $('<i>').addClass('fas fa-info-circle mr-1')
                                )
                                .append(
                                    $('<span>').text('No category assigned')
                                )
                                .appendTo($container);
                        }
                        
                        $container.appendTo(container);
                    }
                },
                {
                    dataField: 'size_available',
                    caption: 'Sizes',
                    allowFiltering: false,
                    cellTemplate: (container, options) => {
                        const sizes = options.data.size_available || [];
                        const $container = $('<div>').addClass('d-flex flex-wrap gap-1');
                        
                        sizes.forEach(size => {
                            $('<span>')
                                .addClass('badge badge-soft-primary')
                                .text(size)
                                .appendTo($container);
                        });
                        
                        $container.appendTo(container);
                    }
                },
                {
                    dataField: 'customization_options',
                    caption: 'Customization',
                    allowFiltering: false,
                    cellTemplate: (container, options) => {
                        const customOptions = options.data.customization_options || {};
                        const $container = $('<div>').addClass('d-flex flex-wrap gap-2');
                        
                        Object.entries(customOptions).forEach(([key, value]) => {
                            if (value) {
                                $('<span>')
                                    .addClass('badge badge-soft-success')
                                    .append($('<i>').addClass('fas fa-check mr-1'))
                                    .append(key.charAt(0).toUpperCase() + key.slice(1))
                                    .appendTo($container);
                            }
                        });
                        
                        $container.appendTo(container);
                    }
                },
                {
                    dataField: 'base_price',
                    caption: 'Price Info',
                    cellTemplate: (container, options) => {
                        const $container = $('<div>').addClass('d-flex flex-column');
                        
                        $('<div>')
                            .addClass('font-weight-bold')
                            .text(`$${options.data.base_price.toFixed(2)}`)
                            .appendTo($container);
                            
                        if (options.data.bulk_discount_rules) {
                            $('<small>')
                                .addClass('text-success')
                                .append($('<i>').addClass('fas fa-tag mr-1'))
                                .append('Bulk discounts available')
                                .appendTo($container);
                        }
                        
                        $container.appendTo(container);
                    }
                },
                {
                    dataField: 'production_time',
                    caption: 'Production',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .append($('<i>').addClass('fas fa-clock mr-1'))
                                    .append(`${options.data.production_time} days`)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted')
                                    .append(`Min. Order: ${options.data.min_order_quantity}`)
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'stock_status',
                    caption: 'Status',
                    cellTemplate: (container, options) => {
                        const status = options.data.stock_status;
                        const statusClass = status === 'in_stock' ? 'text-success' : 'text-danger';
                        const statusIcon = status === 'in_stock' ? 'fa-check-circle' : 'fa-times-circle';
                        
                        $('<div>')
                            .addClass(`d-flex align-items-center ${statusClass}`)
                            .append(
                                $('<i>').addClass(`fas ${statusIcon} mr-2`)
                            )
                            .append(
                                $('<span>').text(status.replace('_', ' ').toUpperCase())
                            )
                            .appendTo(container);
                    }
                },
                {
                    type: 'buttons',
                    width: 140,
                    buttons: [{
                        name: 'view',
                        hint: 'View Details',
                        icon: 'fas fa-eye',
                        onClick: (e) => {
                            // Create modal if it doesn't exist
                            if (!$('#productViewModal').length) {
                                $('body').append(`
                                    <div class="modal fade" id="productViewModal" tabindex="-1" role="dialog">
                                        <div class="modal-dialog modal-xl modal-dialog-centered">
                                            <div class="modal-content">
                                                <div class="modal-header bg-primary py-2">
                                                    <h5 class="modal-title text-white">
                                                        <i class="fas fa-box-open mr-2"></i>
                                                        <span class="product-title"></span>
                                                    </h5>
                                                    <button type="button" class="close text-white" data-dismiss="modal">
                                                        <span>&times;</span>
                                                    </button>
                                                </div>
                                                <div class="modal-body p-0">
                                                    <div class="product-view-container"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `);

                                // Add modal-specific styles
                                $('<style>')
                                    .text(`
                                        #productViewModal .modal-content {
                                            border: none;
                                            border-radius: 8px;
                                            overflow: hidden;
                                        }
                                        #productViewModal .modal-header {
                                            border-bottom: none;
                                        }
                                        #productViewModal .modal-body {
                                            max-height: calc(90vh - 60px);
                                            overflow-y: auto;
                                        }
                                        #productViewModal .close {
                                            opacity: 0.8;
                                            text-shadow: none;
                                            transition: opacity 0.2s;
                                        }
                                        #productViewModal .close:hover {
                                            opacity: 1;
                                        }
                                        .product-view-container {
                                            padding: 1.5rem;
                                        }
                                        .product-view-container .card {
                                            border: none;
                                            box-shadow: 0 0 20px rgba(0,0,0,0.05);
                                            transition: transform 0.2s;
                                        }
                                        .product-view-container .card:hover {
                                            transform: translateY(-2px);
                                        }
                                        .gallery-section {
                                            background: transparent !important;
                                            padding: 0 !important;
                                        }
                                        .main-image-container {
                                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                                        }
                                        .nav-btn {
                                            opacity: 0.7;
                                            transform: scale(0.9);
                                            transition: all 0.2s;
                                        }
                                        .nav-btn:hover {
                                            opacity: 1;
                                            transform: scale(1);
                                        }
                                        .thumbnail-wrapper {
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                        }
                                        .thumbnail-wrapper.active {
                                            transform: scale(1.05);
                                        }
                                        .badge {
                                            font-size: 0.8rem;
                                            padding: 0.4rem 0.8rem;
                                            border-radius: 20px;
                                        }
                                        .badge-soft-primary {
                                            background-color: rgba(94,114,228,0.1);
                                            color: #5e72e4;
                                        }
                                        .badge-soft-info {
                                            background-color: rgba(23,162,184,0.1);
                                            color: #17a2b8;
                                        }
                                        .badge-soft-success {
                                            background-color: rgba(40,167,69,0.1);
                                            color: #28a745;
                                        }
                                    `)
                                    .appendTo('head');
                            }

                            // Update modal content
                            const modal = $('#productViewModal');
                            modal.find('.product-title').text(e.row.data.name);
                            modal.find('.product-view-container').empty().append(
                                this.showProductDetails(e.row.data)
                            );

                            // Show modal
                            modal.modal('show');
                        }
                    }, {
                        name: 'edit',
                        hint: 'Edit Product',
                        icon: 'fas fa-edit'
                    }, {
                        name: 'delete',
                        hint: 'Delete Product',
                        icon: 'fas fa-trash'
                    }]
                }
            ],
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: false },
            masterDetail: {
                enabled: true,
                template: (container, options) => {
                    // Create and append the product details
                    const $details = this.showProductDetails(options.data);
                    container.append($details);
                }
            },
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true,
                showNavigationButtons: true
            },
            editing: {
                mode: 'popup',
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                useIcons: true,
                texts: {
                    confirmDeleteMessage: 'Are you sure you want to delete this product?'
                },
                popup: {
                    title: 'Product Information',
                    showTitle: true,
                    width: '90vw',
                    height: '90vh',
                    maxHeight: '90vh',
                    showCloseButton: true,
                    position: { my: 'center', at: 'center', of: window }
                },
                form: {
                    labelLocation: 'top',
                    showColonAfterLabel: false,
                    colCount: 2,
                    items: [
                        {
                            itemType: 'group',
                            caption: 'Product Images',
                            colSpan: 2,
                            cssClass: 'product-images-section',
                            items: [{
                                dataField: 'images',
                                label: { visible: false },
                                template: (data, itemElement) => {
                                    const $container = $('<div>').addClass('product-images-container');
                                    
                                    // Dropzone area
                                    const $dropzone = $('<div>')
                                        .addClass('dropzone-area')
                                        .append(
                                            $('<div>').addClass('dropzone-content')
                                                .append($('<i>').addClass('fas fa-cloud-upload-alt fa-3x mb-3'))
                                                .append($('<h4>').addClass('mb-2').text('Drag and drop images here'))
                                                .append($('<p>').addClass('text-muted').text('or click to browse'))
                                        )
                                        .on('dragover', (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            $dropzone.addClass('dragover');
                                        })
                                        .on('dragleave', (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            $dropzone.removeClass('dragover');
                                        })
                                        .on('drop', (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            $dropzone.removeClass('dragover');
                                            const files = e.originalEvent.dataTransfer.files;
                                            this.handleImageUpload({ target: { files } }, data, $previewContainer);
                                        })
                                        .appendTo($container);

                                    // Hidden file input
                                    const $fileInput = $('<input>')
                                        .attr('type', 'file')
                                        .attr('multiple', true)
                                        .attr('accept', 'image/*')
                                        .addClass('d-none')
                                        .on('change', (e) => this.handleImageUpload(e, data, $previewContainer))
                                        .appendTo($container);

                                    // Click anywhere in dropzone to trigger file input
                                    $dropzone.on('click', () => $fileInput.click());

                                    // Image preview container
                                    const $previewContainer = $('<div>')
                                        .addClass('image-preview-container')
                                        .appendTo($container);

                                    // Display existing images if any
                                    if (data.editorOptions.value) {
                                        this.displayProductImages(data.editorOptions.value, $previewContainer);
                                    }

                                    itemElement.append($container);
                                }
                            }]
                        },
                        {
                            itemType: 'group',
                            caption: 'Basic Information',
                            colSpan: 1,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'name',
                                    label: { text: 'Product Name' },
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        placeholder: 'Enter product name'
                                    },
                                    validationRules: [{ type: 'required', message: 'Product name is required' }]
                                },
                                {
                                    dataField: 'code',
                                    label: { text: 'Product Code' },
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        placeholder: 'Enter product code'
                                    },
                                    validationRules: [{ type: 'required', message: 'Product code is required' }]
                                },
                                {
                                    dataField: 'category_id',
                                    label: { text: 'Category' },
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        dataSource: this.allCategories,
                                        displayExpr: 'name',
                                        valueExpr: 'id',
                                        placeholder: 'Select a category',
                                        searchEnabled: true,
                                        showClearButton: true,
                                        onValueChanged: (e) => {
                                            console.log('Category selected:', e.value);
                                            if (e.value) {
                                                const selectedCategory = this.allCategories.find(c => c.id === e.value);
                                                if (selectedCategory) {
                                                    // Get the form instance directly
                                                    const form = e.component._form;
                                                    if (form) {
                                                        // Update the form data
                                                        const formData = form.option('formData') || {};
                                                        formData.category_id = selectedCategory.id;
                                                        formData.category = selectedCategory;
                                                        
                                                        // Update the form
                                                        form.updateData('category_id', selectedCategory.id);
                                                        form.updateData('category', selectedCategory);
                                                        
                                                        // Update the grid's editing data
                                                        const editRowKey = this.grid.option('editing.editRowKey');
                                                        if (editRowKey !== undefined) {
                                                            const editData = this.grid.option('editing.changes')[0]?.data || {};
                                                            editData.category_id = selectedCategory.id;
                                                            editData.category = selectedCategory;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    validationRules: [{ type: 'required', message: 'Category is required' }]
                                },
                                {
                                    dataField: 'description',
                                    label: { text: 'Description' },
                                    editorType: 'dxTextArea',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        height: 120,
                                        placeholder: 'Enter product description'
                                    }
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Pricing & Production',
                            colSpan: 1,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'base_price',
                                    label: { text: 'Base Price' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        format: { type: 'currency', precision: 2 },
                                        placeholder: 'Enter base price',
                                        min: 0,
                                        step: 0.01
                                    },
                                    validationRules: [{ type: 'required', message: 'Base price is required' }]
                                },
                                {
                                    dataField: 'production_time',
                                    label: { text: 'Production Time (days)' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        min: 1,
                                        step: 1,
                                        placeholder: 'Production time'
                                    },
                                    validationRules: [{ type: 'required', message: 'Production time is required' }]
                                },
                                {
                                    dataField: 'min_order_quantity',
                                    label: { text: 'Minimum Order Quantity' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        min: 1,
                                        step: 1,
                                        placeholder: 'Minimum order quantity'
                                    },
                                    validationRules: [{ type: 'required', message: 'Minimum order quantity is required' }]
                                },
                                {
                                    dataField: 'stock_status',
                                    label: { text: 'Stock Status' },
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        items: [
                                            { id: 'in_stock', text: 'In Stock' },
                                            { id: 'out_of_stock', text: 'Out of Stock' },
                                            { id: 'pre_order', text: 'Pre-Order' }
                                        ],
                                        displayExpr: 'text',
                                        valueExpr: 'id',
                                        placeholder: 'Select status'
                                    },
                                    validationRules: [{ type: 'required', message: 'Stock status is required' }]
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Bulk Discount Rules',
                            colSpan: 2,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'bulk_discount_rules.10',
                                    label: { text: 'Discount for ≥10 units (%)' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        min: 0,
                                        max: 100,
                                        step: 1,
                                        suffix: '%',
                                        placeholder: 'Enter discount percentage'
                                    }
                                },
                                {
                                    dataField: 'bulk_discount_rules.20',
                                    label: { text: 'Discount for ≥20 units (%)' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        min: 0,
                                        max: 100,
                                        step: 1,
                                        suffix: '%',
                                        placeholder: 'Enter discount percentage'
                                    }
                                },
                                {
                                    dataField: 'bulk_discount_rules.50',
                                    label: { text: 'Discount for ≥50 units (%)' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        min: 0,
                                        max: 100,
                                        step: 1,
                                        suffix: '%',
                                        placeholder: 'Enter discount percentage'
                                    }
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Product Details',
                            colSpan: 2,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'material',
                                    label: { text: 'Material' },
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        placeholder: 'Enter material type'
                                    },
                                    validationRules: [{ type: 'required', message: 'Material is required' }]
                                },
                                {
                                    dataField: 'weight',
                                    label: { text: 'Weight (g)' },
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        min: 0,
                                        step: 1,
                                        placeholder: 'Enter weight in grams'
                                    },
                                    validationRules: [{ type: 'required', message: 'Weight is required' }]
                                },
                                {
                                    dataField: 'size_available',
                                    label: { text: 'Available Sizes' },
                                    editorType: 'dxTagBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        items: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
                                        showSelectionControls: true,
                                        placeholder: 'Select available sizes',
                                        multiline: false
                                    },
                                    validationRules: [{ type: 'required', message: 'At least one size must be selected' }]
                                },
                                {
                                    dataField: 'color_options',
                                    label: { text: 'Color Options' },
                                    editorType: 'dxTagBox',
                                    editorOptions: {
                                        stylingMode: 'filled',
                                        items: ['Red/White', 'Blue/White', 'Green/White', 'Black/White', 'Custom'],
                                        showSelectionControls: true,
                                        placeholder: 'Select available colors',
                                        multiline: false
                                    },
                                    validationRules: [{ type: 'required', message: 'At least one color must be selected' }]
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Customization Options',
                            colSpan: 2,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'customization_options.name',
                                    label: { text: 'Name Customization' },
                                    editorType: 'dxSwitch',
                                    editorOptions: {
                                        switchedOnText: 'YES',
                                        switchedOffText: 'NO'
                                    }
                                },
                                {
                                    dataField: 'customization_options.number',
                                    label: { text: 'Number Customization' },
                                    editorType: 'dxSwitch',
                                    editorOptions: {
                                        switchedOnText: 'YES',
                                        switchedOffText: 'NO'
                                    }
                                },
                                {
                                    dataField: 'customization_options.patches',
                                    label: { text: 'Patches Available' },
                                    editorType: 'dxSwitch',
                                    editorOptions: {
                                        switchedOnText: 'YES',
                                        switchedOffText: 'NO'
                                    }
                                },
                                {
                                    dataField: 'customization_options.team_logo',
                                    label: { text: 'Team Logo Available' },
                                    editorType: 'dxSwitch',
                                    editorOptions: {
                                        switchedOnText: 'YES',
                                        switchedOffText: 'NO'
                                    }
                                }
                            ]
                        }
                    ]
                },
                startEditAction: 'click',
                refreshMode: 'reshape'
            },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add Product',
                            onClick: () => this.grid.addRow()
                        }
                    },
                    'searchPanel',
                    'columnChooserButton'
                ]
            },
            onRowInserting: (e) => this.handleRowInserting(e),
            onRowUpdating: (e) => this.handleRowUpdating(e),
            onRowRemoving: (e) => this.handleRowRemoving(e),
            onInitialized: (e) => {
                this.grid = e.component;
                console.log('Grid initialized');
            },
            onEditingStart: (e) => {
                console.log('Edit starting for row:', e.key);
                console.log('Row data:', e.data);
                
                // Wait for the popup to be shown and form to be created
                setTimeout(() => {
                    // Get the existing data
                    const formData = { ...e.data };  // Create a copy of existing data
                    console.log('Original data when editing starts:', formData);

                    // Get the form instance
                    const form = $('.dx-popup-content .dx-form').dxForm('instance');
                    if (!form) {
                        console.error('Form instance not found');
                        return;
                    }

                    // Initialize arrays with existing values or empty arrays
                    formData.size_available = Array.isArray(formData.size_available) ? formData.size_available : [];
                    formData.color_options = Array.isArray(formData.color_options) ? formData.color_options : [];
                    formData.images = Array.isArray(formData.images) ? formData.images : [];
                    
                    // Initialize customization options while preserving existing values
                    formData.customization_options = {
                        name: Boolean(formData.customization_options?.name),
                        number: Boolean(formData.customization_options?.number),
                        patches: Boolean(formData.customization_options?.patches),
                        team_logo: Boolean(formData.customization_options?.team_logo)
                    };
                    
                    // Initialize bulk discount rules while preserving existing values
                    formData.bulk_discount_rules = {
                        10: parseInt(formData.bulk_discount_rules?.['10']) || 0,
                        20: parseInt(formData.bulk_discount_rules?.['20']) || 0,
                        50: parseInt(formData.bulk_discount_rules?.['50']) || 0
                    };
                    
                    // Ensure category is properly set
                    if (formData.category_id) {
                        formData.category_id = parseInt(formData.category_id);
                        const category = this.allCategories.find(c => c.id === formData.category_id);
                        if (category) {
                            formData.category = category;
                        }
                    }

                    // Set the entire form data first
                    form.option('formData', formData);

                    // Then update each field individually to ensure proper binding
                    Object.entries(formData).forEach(([key, value]) => {
                        if (value !== undefined) {
                            form.updateData(key, value);
                        }
                    });

                    // Update nested fields
                    if (formData.customization_options) {
                        Object.entries(formData.customization_options).forEach(([key, value]) => {
                            form.updateData(`customization_options.${key}`, value);
                        });
                    }

                    if (formData.bulk_discount_rules) {
                        Object.entries(formData.bulk_discount_rules).forEach(([key, value]) => {
                            form.updateData(`bulk_discount_rules.${key}`, value);
                        });
                    }

                    // Update specific fields that might need type conversion
                    form.updateData('base_price', parseFloat(formData.base_price) || 0);
                    form.updateData('production_time', parseInt(formData.production_time) || 1);
                    form.updateData('min_order_quantity', parseInt(formData.min_order_quantity) || 1);
                    form.updateData('weight', parseInt(formData.weight) || 100);
                    form.updateData('is_active', Boolean(formData.is_active));
                    form.updateData('stock_status', formData.stock_status || 'in_stock');
                    form.updateData('material', formData.material || 'Default Material');
                    form.updateData('description', formData.description || '');
                    form.updateData('code', formData.code || `PROD-${Date.now()}`);

                    // Force form to update UI
                    form.repaint();

                    // Log the final state
                    console.log('Final form data after initialization:', form.option('formData'));
                }, 100);
            },
            onRowUpdating: (e) => {
                console.log('Row updating:', e);
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            const data = await zentra.getProducts();
            this.grid.option('dataSource', data);
        } catch (error) {
            console.error('Error loading products:', error);
            DevExpress.ui.notify('Failed to load products', 'error', 3000);
        }
    }

    renderCategories() {
        const $categoryList = $('.category-list');
        $categoryList.empty();

        const filteredCategories = this.allCategories.filter(category => 
            category.name.toLowerCase().includes(this.categoryFilter) ||
            category.description?.toLowerCase().includes(this.categoryFilter)
        );

        if (filteredCategories.length === 0) {
            $categoryList.html(`
                <div class="no-categories">
                    <i class="fas fa-search"></i>
                    No categories found matching your search
                </div>
            `);
            return;
        }

        filteredCategories.forEach(category => {
            const isSelected = this.selectedCategory?.id === category.id;
            const $categoryItem = this.createCategoryItem(category, isSelected);
            $categoryList.append($categoryItem);
        });
    }

    createCategoryItem(category, isSelected) {
        return $(`
            <div class="category-item ${isSelected ? 'selected' : ''}" data-category-id="${category.id}">
                <div class="custom-control custom-radio">
                    <input type="radio" class="custom-control-input" id="category-${category.id}"
                           name="category" ${isSelected ? 'checked' : ''}>
                    <label class="custom-control-label" for="category-${category.id}"></label>
                </div>
                <div class="category-info">
                    <div class="category-name">${category.name}</div>
                    <div class="category-details">${category.description || 'No description provided'}</div>
                </div>
            </div>
        `).on('change', (e) => {
            if (e.target.checked) {
                this.selectedCategory = category;
            }
        });
    }

    async saveCategory() {
        try {
            if (!this.selectedCategory) {
                DevExpress.ui.notify('Please select a category', 'warning', 3000);
                return;
            }

            await zentra.updateProduct(this.currentProduct.id, {
                category_id: this.selectedCategory.id
            });

            $('#categoryModal').modal('hide');
            this.loadData();
            DevExpress.ui.notify('Category assigned successfully', 'success', 3000);
        } catch (error) {
            console.error('Error saving category:', error);
            DevExpress.ui.notify('Failed to assign category', 'error', 3000);
        }
    }

    async handleRowInserting(e) {
        try {
            // Get the form instance
            const $form = $('.dx-popup-content .dx-form');
            const form = $form.length ? $form.dxForm('instance') : null;
            
            if (!form) {
                throw new Error('Form instance not found');
            }

            // Get all form data
            const formData = form.option('formData') || {};
            console.log('Form data before processing:', formData);

            // Get the grid's editing data
            const gridData = e.data || {};
            console.log('Grid data:', gridData);

            // Merge form data with grid data, giving priority to form data
            const cleanData = { ...gridData, ...formData };
            console.log('Merged data:', cleanData);

            // Remove any temporary fields
            delete cleanData.__KEY__;
            delete cleanData.pendingImages;

            // Initialize arrays if they don't exist
            cleanData.size_available = Array.isArray(cleanData.size_available) ? cleanData.size_available : [];
            cleanData.color_options = Array.isArray(cleanData.color_options) ? cleanData.color_options : [];
            cleanData.images = Array.isArray(cleanData.images) ? cleanData.images : [];

            // Initialize customization options
            cleanData.customization_options = {
                name: Boolean(cleanData.customization_options?.name),
                number: Boolean(cleanData.customization_options?.number),
                patches: Boolean(cleanData.customization_options?.patches),
                team_logo: Boolean(cleanData.customization_options?.team_logo),
                ...cleanData.customization_options
            };

            // Initialize bulk discount rules
            cleanData.bulk_discount_rules = {
                10: parseInt(cleanData.bulk_discount_rules?.['10']) || 0,
                20: parseInt(cleanData.bulk_discount_rules?.['20']) || 0,
                50: parseInt(cleanData.bulk_discount_rules?.['50']) || 0,
                ...cleanData.bulk_discount_rules
            };

            // Set default values for missing fields
            cleanData.code = cleanData.code || `PROD-${Date.now()}`;
            cleanData.material = cleanData.material || 'Default Material';
            cleanData.description = cleanData.description || '';
            cleanData.weight = parseInt(cleanData.weight) || 100;
            cleanData.min_order_quantity = parseInt(cleanData.min_order_quantity) || 1;
            cleanData.is_active = cleanData.is_active !== undefined ? Boolean(cleanData.is_active) : true;
            cleanData.stock_status = cleanData.stock_status || 'in_stock';

            // Ensure numeric fields are properly formatted
            cleanData.base_price = parseFloat(cleanData.base_price) || 0;
            cleanData.production_time = parseInt(cleanData.production_time) || 1;
            cleanData.min_order_quantity = parseInt(cleanData.min_order_quantity) || 1;
            cleanData.weight = parseInt(cleanData.weight) || 100;

            // Handle category_id and category object
            if (cleanData.category_id) {
                cleanData.category_id = parseInt(cleanData.category_id);
                const category = this.allCategories.find(c => c.id === cleanData.category_id);
                if (category) {
                    cleanData.category = category;
                } else {
                    throw new Error('Invalid category selected');
                }
            } else {
                throw new Error('Category is required');
            }

            // Validate required fields
            const requiredFields = {
                name: { value: cleanData.name, message: 'Product name is required' },
                category_id: { value: cleanData.category_id, message: 'Category is required' },
                base_price: { value: parseFloat(cleanData.base_price), message: 'Base price is required' },
                production_time: { value: parseInt(cleanData.production_time), message: 'Production time is required' },
                size_available: { value: cleanData.size_available?.length > 0, message: 'At least one size must be selected' }
            };

            // Check each required field
            for (const [field, { value, message }] of Object.entries(requiredFields)) {
                if (!value && value !== 0) {
                    console.error(`Missing required field: ${field}`, cleanData);
                    throw new Error(message);
                }
            }

            console.log('Final data being sent to API:', cleanData);

            // Create the product
            const result = await zentra.createProduct(cleanData);
            e.data.id = result.id;

            // Handle image uploads if any
            if (e.data.pendingImages && e.data.pendingImages.length > 0) {
                for (const file of e.data.pendingImages) {
                    try {
                        const uploadedImage = await zentra.uploadProductImage(result.id, file);
                        if (!e.data.images) {
                            e.data.images = [];
                        }
                        e.data.images.push(uploadedImage);
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        DevExpress.ui.notify(`Failed to upload image: ${file.name}`, 'error', 3000);
                    }
                }
                delete e.data.pendingImages;
            }

            DevExpress.ui.notify('Product created successfully', 'success', 3000);
            // Refresh the grid data
            await this.loadData();
        } catch (error) {
            console.error('Error creating product:', error);
            e.cancel = true;
            DevExpress.ui.notify('Error creating product: ' + error.message, 'error', 3000);
        }
    }

    async handleRowUpdating(e) {
        try {
            // Get the form instance
            const $form = $('.dx-popup-content .dx-form');
            const form = $form.length ? $form.dxForm('instance') : null;
            
            if (!form) {
                throw new Error('Form instance not found');
            }

            // Get all form data
            const formData = form.option('formData') || {};
            console.log('Form data before processing:', formData);

            // Get the grid's editing data
            const gridData = e.newData || {};
            console.log('Grid data:', gridData);

            // Merge form data with grid data, giving priority to form data
            const cleanData = { ...e.oldData, ...gridData, ...formData };
            console.log('Merged data:', cleanData);

            // Remove any temporary fields
            delete cleanData.__KEY__;
            delete cleanData.pendingImages;

            // Initialize arrays if they don't exist
            cleanData.size_available = Array.isArray(cleanData.size_available) ? cleanData.size_available : [];
            cleanData.color_options = Array.isArray(cleanData.color_options) ? cleanData.color_options : [];
            cleanData.images = Array.isArray(cleanData.images) ? cleanData.images : [];

            // Initialize customization options
            cleanData.customization_options = {
                name: Boolean(cleanData.customization_options?.name),
                number: Boolean(cleanData.customization_options?.number),
                patches: Boolean(cleanData.customization_options?.patches),
                team_logo: Boolean(cleanData.customization_options?.team_logo),
                ...cleanData.customization_options
            };

            // Initialize bulk discount rules
            cleanData.bulk_discount_rules = {
                10: parseInt(cleanData.bulk_discount_rules?.['10']) || 0,
                20: parseInt(cleanData.bulk_discount_rules?.['20']) || 0,
                50: parseInt(cleanData.bulk_discount_rules?.['50']) || 0,
                ...cleanData.bulk_discount_rules
            };

            // Set default values for missing fields
            cleanData.code = cleanData.code || `PROD-${Date.now()}`;
            cleanData.material = cleanData.material || 'Default Material';
            cleanData.description = cleanData.description || '';
            cleanData.weight = parseInt(cleanData.weight) || 100;
            cleanData.min_order_quantity = parseInt(cleanData.min_order_quantity) || 1;
            cleanData.is_active = cleanData.is_active !== undefined ? Boolean(cleanData.is_active) : true;
            cleanData.stock_status = cleanData.stock_status || 'in_stock';

            // Ensure numeric fields are properly formatted
            cleanData.base_price = parseFloat(cleanData.base_price) || 0;
            cleanData.production_time = parseInt(cleanData.production_time) || 1;
            cleanData.min_order_quantity = parseInt(cleanData.min_order_quantity) || 1;
            cleanData.weight = parseInt(cleanData.weight) || 100;

            // Handle category_id and category object
            if (cleanData.category_id) {
                cleanData.category_id = parseInt(cleanData.category_id);
                const category = this.allCategories.find(c => c.id === cleanData.category_id);
                if (category) {
                    cleanData.category = category;
                } else {
                    throw new Error('Invalid category selected');
                }
            } else {
                throw new Error('Category is required');
            }

            // Validate required fields
            const requiredFields = {
                name: { value: cleanData.name, message: 'Product name is required' },
                category_id: { value: cleanData.category_id, message: 'Category is required' },
                base_price: { value: parseFloat(cleanData.base_price), message: 'Base price is required' },
                production_time: { value: parseInt(cleanData.production_time), message: 'Production time is required' },
                size_available: { value: cleanData.size_available?.length > 0, message: 'At least one size must be selected' }
            };

            // Check each required field
            for (const [field, { value, message }] of Object.entries(requiredFields)) {
                if (!value && value !== 0) {
                    console.error(`Missing required field: ${field}`, cleanData);
                    throw new Error(message);
                }
            }

            console.log('Final data being sent to API:', cleanData);

            // Update the product
            await zentra.updateProduct(e.key.id, cleanData);

            // Handle image uploads if any
            if (e.data.pendingImages && e.data.pendingImages.length > 0) {
                for (const file of e.data.pendingImages) {
                    try {
                        const uploadedImage = await zentra.uploadProductImage(e.key.id, file);
                        if (!cleanData.images) {
                            cleanData.images = [];
                        }
                        cleanData.images.push(uploadedImage);
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        DevExpress.ui.notify(`Failed to upload image: ${file.name}`, 'error', 3000);
                    }
                }
                delete e.data.pendingImages;
            }

            DevExpress.ui.notify('Product updated successfully', 'success', 3000);
            // Refresh the grid data
            await this.loadData();
        } catch (error) {
            console.error('Error updating product:', error);
            e.cancel = true;
            DevExpress.ui.notify('Error updating product: ' + error.message, 'error', 3000);
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteProduct(e.key.id);
            DevExpress.ui.notify('Product deleted successfully', 'success', 3000);
            // Refresh the grid data
            await this.loadData();
        } catch (error) {
            console.error('Error deleting product:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to delete product', 'error', 3000);
        }
    }

    editProduct(product) {
        const rowIndex = this.grid.getRowIndexByKey(product.id);
        if (rowIndex >= 0) {
            this.grid.editRow(rowIndex);
        }
    }

    deleteProduct(product) {
        const rowIndex = this.grid.getRowIndexByKey(product.id);
        if (rowIndex >= 0) {
            DevExpress.ui.dialog.confirm("Are you sure you want to delete this product?", "Confirm deletion")
                .then((result) => {
                    if (result) {
                        this.grid.deleteRow(rowIndex);
                    }
                });
        }
    }

    async handleImageUpload(event, data, previewContainer) {
        const files = Array.from(event.target.files || event.originalEvent?.dataTransfer?.files || []);
        console.log('Files to upload:', files);
        
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        
        // Get product ID from the form data
        const formData = data.component.option('formData');
        const productId = formData && formData.id;
        
        console.log('Product ID:', productId);
        
        // For new products, we'll store the files temporarily
        if (!productId) {
            if (!formData.pendingImages) {
                formData.pendingImages = [];
            }
            
            for (const file of files) {
                if (file.size > maxSize) {
                    DevExpress.ui.notify(`File ${file.name} exceeds 5MB limit`, 'error', 3000);
                    continue;
                }

                console.log('Adding pending file:', file);
                // Store file and show preview
                const tempPreview = this.createImagePreview(URL.createObjectURL(file));
                previewContainer.append(tempPreview);
                formData.pendingImages.push(file);
            }
            
            // Update form data with pending images
            data.component.option('formData', formData);
            return;
        }
        
        // For existing products, upload immediately
        for (const file of files) {
            if (file.size > maxSize) {
                DevExpress.ui.notify(`File ${file.name} exceeds 5MB limit`, 'error', 3000);
                continue;
            }

            try {
                console.log('Uploading file:', file);
                
                // Show loading preview
                const tempPreview = this.createImagePreview(URL.createObjectURL(file));
                tempPreview.addClass('uploading');
                previewContainer.append(tempPreview);

                // Upload the image directly
                const uploadedImage = await zentra.uploadProductImage(productId, file);
                console.log('Uploaded image response:', uploadedImage);

                // Update preview with actual image URL
                tempPreview.removeClass('uploading');
                const imageUrl = uploadedImage.image_url;
                const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${getBaseUrl()}${imageUrl}`;
                tempPreview.find('img').attr('src', fullImageUrl);

                // Add to form data
                if (!formData.images) {
                    formData.images = [];
                }
                formData.images.push({
                    ...uploadedImage,
                    url: uploadedImage.image_url // Store the relative URL
                });
                
                // Update the form data
                data.component.option('formData', formData);

                DevExpress.ui.notify('Image uploaded successfully', 'success', 3000);
            } catch (error) {
                console.error('Error uploading image:', error);
                DevExpress.ui.notify(`Failed to upload image: ${error.message}`, 'error', 3000);
            }
        }
    }

    createImagePreview(src) {
        // If it's a blob URL (for temporary preview), use it as is
        // Otherwise, check if it's already a full URL
        const imageUrl = src.startsWith('blob:') ? src :
            src.startsWith('http') ? src : `${getBaseUrl()}${src}`;
        
        return $('<div>')
            .addClass('image-preview')
            .append(
                $('<div>')
                    .addClass('image-wrapper')
                    .append(
                        $('<img>')
                            .attr('src', imageUrl)
                            .attr('alt', 'Product Image')
                            .on('load', function() {
                                $(this).addClass('loaded');
                            })
                    )
                    .append(
                        $('<div>')
                            .addClass('image-overlay')
                            .append(
                                $('<div>')
                                    .addClass('overlay-buttons')
                                    .append(
                                        $('<button>')
                                            .addClass('btn-action zoom-btn')
                                            .append($('<i>').addClass('fas fa-search-plus'))
                                            .on('click', (e) => {
                                                e.stopPropagation();
                                                this.showImageModal(imageUrl);
                                            })
                                    )
                                    .append(
                                        $('<button>')
                                            .addClass('btn-action delete-btn')
                                            .append($('<i>').addClass('fas fa-trash'))
                                            .on('click', (e) => {
                                                e.stopPropagation();
                                                $(e.target).closest('.image-preview').remove();
                                            })
                                    )
                            )
                    )
            )
            .append(
                $('<div>')
                    .addClass('loading-spinner')
                    .append(
                        $('<div>').addClass('spinner-border text-primary')
                    )
            );
    }

    showImageModal(imageUrl) {
        // Create modal if it doesn't exist
        if (!$('#imagePreviewModal').length) {
            $('body').append(`
                <div class="modal fade" id="imagePreviewModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal">
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div class="modal-body text-center p-0">
                                <img src="" class="img-fluid" alt="Product Image Preview">
                            </div>
                        </div>
                    </div>
                </div>
            `);
        }

        // Update image source and show modal
        const modal = $('#imagePreviewModal');
        modal.find('.modal-body img').attr('src', imageUrl);
        modal.modal({
            show: true,
            backdrop: 'static',
            keyboard: true
        });
    }

    displayProductImages(images, container) {
        container.empty();
        
        // Add image preview container
        const $previewContainer = $('<div>')
            .addClass('image-preview-grid')
            .appendTo(container);

        // Add images
        images.forEach(image => {
            const imageUrl = image.url || image.image_url;
            // Check if the URL is already absolute
            const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${getBaseUrl()}${imageUrl}`;
            
            const $preview = this.createImagePreview(imageUrl); // Pass relative URL, createImagePreview will handle the base URL
            $previewContainer.append($preview);
        });

        // Add dropzone reminder if no images
        if (!images.length) {
            container.append(`
                <div class="no-images-placeholder">
                    <i class="fas fa-images fa-3x mb-3"></i>
                    <h5>No Images Added</h5>
                    <p class="text-muted">Drag and drop images here or click to upload</p>
                </div>
            `);
        }
    }

    showProductDetails(product) {
        const $container = $('<div>')
            .addClass('product-details-container');

        // Image Gallery Section
        if (product.images && product.images.length > 0) {
            const $gallerySection = $('<div>')
                .addClass('gallery-section mb-4')
                .append(`
                    <div class="row">
                        <div class="col-md-8">
                            <div class="main-image-container position-relative">
                                <img src="${this.getFullImageUrl(product.images[0].url || product.images[0].image_url)}" 
                                    class="main-image img-fluid rounded shadow-sm" 
                                    alt="${product.name}">
                                <div class="image-navigation">
                                    <button class="nav-btn prev-btn"><i class="fas fa-chevron-left"></i></button>
                                    <button class="nav-btn next-btn"><i class="fas fa-chevron-right"></i></button>
                                </div>
                                <div class="image-counter">1/${product.images.length}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="thumbnails-container">
                                ${product.images.map((image, index) => `
                                    <div class="thumbnail-wrapper ${index === 0 ? 'active' : ''}" data-index="${index}">
                                        <img src="${this.getFullImageUrl(image.url || image.image_url)}" 
                                            class="thumbnail-image" 
                                            alt="Thumbnail ${index + 1}">
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `);

            // Add gallery interaction
            let currentImageIndex = 0;
            const updateMainImage = (index) => {
                const images = product.images;
                currentImageIndex = (index + images.length) % images.length;
                const newImage = images[currentImageIndex];
                
                $gallerySection.find('.main-image')
                    .attr('src', this.getFullImageUrl(newImage.url || newImage.image_url));
                $gallerySection.find('.image-counter')
                    .text(`${currentImageIndex + 1}/${images.length}`);
                $gallerySection.find('.thumbnail-wrapper')
                    .removeClass('active')
                    .eq(currentImageIndex)
                    .addClass('active');
            };

            // Bind navigation events
            $gallerySection.find('.prev-btn').on('click', () => updateMainImage(currentImageIndex - 1));
            $gallerySection.find('.next-btn').on('click', () => updateMainImage(currentImageIndex + 1));
            $gallerySection.find('.thumbnail-wrapper').on('click', function() {
                updateMainImage($(this).data('index'));
            });

            $container.append($gallerySection);
        }

        // Add styles for the gallery
        $('<style>')
            .text(`
                .gallery-section {
                    background: #fff;
                    border-radius: 8px;
                    padding: 1.5rem;
                }
                .main-image-container {
                    position: relative;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #f8f9fa;
                }
                .main-image {
                    width: 100%;
                    height: 400px;
                    object-fit: contain;
                    background: #fff;
                }
                .image-navigation {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    transform: translateY(-50%);
                    display: flex;
                    justify-content: space-between;
                    padding: 0 1rem;
                    pointer-events: none;
                }
                .nav-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.9);
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    pointer-events: auto;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .nav-btn:hover {
                    background: #fff;
                    transform: scale(1.1);
                }
                .image-counter {
                    position: absolute;
                    bottom: 1rem;
                    right: 1rem;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                }
                .thumbnails-container {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                    max-height: 400px;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                }
                .thumbnail-wrapper {
                    position: relative;
                    padding-bottom: 100%;
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .thumbnail-wrapper:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 3px 6px rgba(0,0,0,0.1);
                }
                .thumbnail-wrapper.active {
                    border: 2px solid #5e72e4;
                }
                .thumbnail-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                /* Scrollbar styling for thumbnails */
                .thumbnails-container::-webkit-scrollbar {
                    width: 4px;
                }
                .thumbnails-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 2px;
                }
                .thumbnails-container::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 2px;
                }
                .thumbnails-container::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `)
            .appendTo('head');

        // Rest of the product details (existing code)
        const detailsContent = `
            <div class="row mt-4">
                <div class="col-md-4">
                    <div class="card shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title text-uppercase text-muted mb-3">
                                <i class="fas fa-box-open mr-2"></i>Product Details
                            </h6>
                            <div class="mb-2">
                                <small class="text-muted">Material</small>
                                <div class="font-weight-bold">${product.material}</div>
                            </div>
                            <div class="mb-2">
                                <small class="text-muted">Weight</small>
                                <div class="font-weight-bold">${product.weight}g</div>
                            </div>
                            <div>
                                <small class="text-muted">Description</small>
                                <div class="text-muted">${product.description}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title text-uppercase text-muted mb-3">
                                <i class="fas fa-palette mr-2"></i>Available Options
                            </h6>
                            <div class="mb-3">
                                <small class="text-muted d-block mb-2">Sizes</small>
                                <div class="d-flex flex-wrap gap-2">
                                    ${(product.size_available || []).map(size => 
                                        `<span class="badge badge-soft-primary">${size}</span>`
                                    ).join('')}
                                </div>
                            </div>
                            <div>
                                <small class="text-muted d-block mb-2">Colors</small>
                                <div class="d-flex flex-wrap gap-2">
                                    ${(product.color_options || []).map(color => 
                                        `<span class="badge badge-soft-info">${color}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title text-uppercase text-muted mb-3">
                                <i class="fas fa-tags mr-2"></i>Bulk Discounts
                            </h6>
                            <div class="table-responsive">
                                <table class="table table-sm mb-0">
                                    <thead>
                                        <tr>
                                            <th>Quantity</th>
                                            <th>Discount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries(product.bulk_discount_rules || {}).map(([qty, discount]) => `
                                            <tr>
                                                <td>≥${qty} units</td>
                                                <td><span class="text-success">${discount}% off</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $container.append(detailsContent);
        return $container;
    }

    // Helper function to get full image URL
    getFullImageUrl(url) {
        if (!url) return '';
        return url.startsWith('http') ? url : `${getBaseUrl()}${url}`;
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.productPageInstance) {
    window.productPageInstance = new window.ProductPage();
} 