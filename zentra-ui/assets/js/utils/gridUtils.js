import { zentra } from '../api/index.js';

// Common grid utility functions
export const gridUtils = {
    // Add export buttons to grid toolbar
    addExportButtons(grid, fileName) {
        if (!grid) {
            console.warn('Grid instance is not available');
            return;
        }

        try {
            const toolbarItems = grid.option('toolbar.items') || [];
            
            // Add export buttons before the search panel
            const exportButtons = [
                {
                    location: 'before',
                    widget: 'dxButton',
                    options: {
                        icon: 'exportxlsx',
                        text: 'Export to Excel',
                        onClick: () => this.exportToExcel(grid, fileName)
                    }
                },
                {
                    location: 'before',
                    widget: 'dxButton',
                    options: {
                        icon: 'exportpdf',
                        text: 'Export to PDF',
                        onClick: () => this.exportToPDF(grid, fileName)
                    }
                }
            ];

            // Insert export buttons before the search panel
            const searchPanelIndex = toolbarItems.findIndex(item => item === 'searchPanel');
            if (searchPanelIndex !== -1) {
                toolbarItems.splice(searchPanelIndex, 0, ...exportButtons);
            } else {
                toolbarItems.unshift(...exportButtons); // Add to beginning if no search panel
            }

            grid.option('toolbar.items', toolbarItems);
        } catch (error) {
            console.error('Error adding export buttons:', error);
        }
    },

    // Export to Excel
    exportToExcel(grid, fileName) {
        if (!grid) {
            console.warn('Grid instance is not available');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');

            // Get visible columns and data
            const columns = grid.getVisibleColumns()
                .filter(col => {
                    // Only include columns that have a dataField and are exportable
                    return col.dataField && col.allowExporting !== false;
                });
            const data = grid.getDataSource().items();

            if (!data.length) {
                this.showWarning('No data available to export');
                return;
            }
            
            // Add headers with styling
            const headerRow = worksheet.addRow(columns.map(col => col.caption));
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E6EF' }
            };

            // Add data with proper formatting
            data.forEach(item => {
                const rowData = columns.map(col => {
                    let value = item[col.dataField];
                    
                    // Handle nested properties using dot notation
                    if (col.dataField.includes('.')) {
                        value = col.dataField.split('.').reduce((obj, key) => obj ? obj[key] : '', item);
                    }
                    
                    if (!value) return '';
                    
                    // Handle special cases
                    if (value instanceof Date) {
                        return value.toLocaleString();
                    }
                    if (typeof value === 'object') {
                        // If it's an array, join the names or values
                        if (Array.isArray(value)) {
                            return value.map(v => v.name || v.value || JSON.stringify(v)).join(', ');
                        }
                        // For objects, try to get a meaningful string representation
                        if (value.name) return value.name;
                        if (value.value) return value.value;
                        // For other objects, try to get a meaningful string representation
                        const objStr = JSON.stringify(value);
                        return objStr === '{}' ? '' : objStr;
                    }
                    return value;
                });
                worksheet.addRow(rowData);
            });

            // Auto-fit columns and add borders
            worksheet.columns.forEach((column, index) => {
                column.width = Math.max(
                    columns[index].caption.length + 5,
                    ...data.map(item => {
                        const value = item[columns[index].dataField];
                        return value ? String(value).length + 2 : 10;
                    })
                );
            });

            // Generate and download file
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const downloadLink = document.createElement('a');
                downloadLink.style.display = 'none';
                downloadLink.download = `${fileName || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
                downloadLink.setAttribute('data-no-route', 'true');
                
                // Create a temporary URL for the blob and trigger download
                downloadLink.href = window.URL.createObjectURL(blob);
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(downloadLink);
                    window.URL.revokeObjectURL(downloadLink.href);
                }, 100);
                
                this.showSuccess('Export to Excel completed successfully');
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.handleGridError(error, 'exporting to Excel');
        }
    },

    // Export to PDF
    exportToPDF(grid, fileName) {
        if (!grid) {
            console.warn('Grid instance is not available');
            return;
        }

        try {
            // Check if jsPDF is available
            if (typeof jsPDF === 'undefined') {
                if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
                    window.jsPDF = window.jspdf.jsPDF;
                } else {
                    throw new Error('jsPDF library is not loaded. Please refresh the page and try again.');
                }
            }

            const columns = grid.getVisibleColumns()
                .filter(col => {
                    // Only include columns that have a dataField and are exportable
                    return col.dataField && col.allowExporting !== false;
                });
            const data = grid.getDataSource().items();

            if (!data.length) {
                this.showWarning('No data available to export');
                return;
            }

            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
            
            // Add title
            doc.setFontSize(16);
            doc.text(fileName || 'Export', 14, 15);
            
            // Calculate column widths
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;
            const usableWidth = pageWidth - (2 * margin);
            const columnWidth = usableWidth / columns.length;

            // Add headers
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFillColor(224, 230, 239);
            doc.rect(margin, 20, usableWidth, 8, 'F');
            
            let x = margin;
            columns.forEach(col => {
                doc.text(col.caption, x + 2, 25);
                x += columnWidth;
            });

            // Add data
            let y = 35;
            data.forEach((item, rowIndex) => {
                // Add alternating row background
                if (rowIndex % 2 === 1) {
                    doc.setFillColor(249, 250, 251);
                    doc.rect(margin, y - 4, usableWidth, 8, 'F');
                }

                x = margin;
                columns.forEach(col => {
                    let value = item[col.dataField];
                    
                    // Handle nested properties using dot notation
                    if (col.dataField.includes('.')) {
                        value = col.dataField.split('.').reduce((obj, key) => obj ? obj[key] : '', item);
                    }
                    
                    let text = '';
                    
                    if (value) {
                        if (value instanceof Date) {
                            text = value.toLocaleString();
                        } else if (typeof value === 'object') {
                            // If it's an array, join the names or values
                            if (Array.isArray(value)) {
                                text = value.map(v => v.name || v.value || JSON.stringify(v)).join(', ');
                            }
                            // For objects, try to get a meaningful string representation
                            else if (value.name) text = value.name;
                            else if (value.value) text = value.value;
                            else text = JSON.stringify(value);
                        } else {
                            text = String(value);
                        }
                    }

                    // Truncate long text
                    text = text.length > 25 ? text.substring(0, 22) + '...' : text;
                    doc.text(text, x + 2, y);
                    x += columnWidth;
                });
                y += 8;

                // Add new page if needed
                if (y > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    y = 20;
                }
            });

            // Generate blob and download
            const pdfOutput = doc.output('blob');
            const downloadLink = document.createElement('a');
            downloadLink.style.display = 'none';
            downloadLink.download = `${fileName || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`;
            downloadLink.setAttribute('data-no-route', 'true');
            
            // Create a temporary URL for the blob and trigger download
            downloadLink.href = window.URL.createObjectURL(pdfOutput);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(downloadLink);
                window.URL.revokeObjectURL(downloadLink.href);
            }, 100);
            
            this.showSuccess('Export to PDF completed successfully');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            this.handleGridError(error, 'exporting to PDF');
        }
    },

    // Common grid configuration
    getCommonGridConfig(options = {}) {
        return {
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: true },
            columnChooser: { enabled: true },
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20, 50],
                showInfo: true,
                showNavigationButtons: true
            },
            loadPanel: {
                enabled: true,
                text: 'Loading...'
            },
            stateStoring: {
                enabled: true,
                type: 'localStorage',
                storageKey: 'gridState'
            },
            ...options
        };
    },

    // Common error handling
    handleGridError(error, operation) {
        console.error(`Error ${operation}:`, error);
        DevExpress.ui.notify(`Failed to ${operation}`, 'error', 3000);
    },

    // Common success notification
    showSuccess(message) {
        DevExpress.ui.notify(message, 'success', 3000);
    },

    // Warning notification
    showWarning(message) {
        DevExpress.ui.notify(message, 'warning', 3000);
    }
}; 