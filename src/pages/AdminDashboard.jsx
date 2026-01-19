import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch, setDoc } from 'firebase/firestore';
import { LogOut, LayoutDashboard, PlusCircle, Settings, ShoppingBag, Trash2, Edit2, X, Save, Loader2, Image as ImageIcon, FileSpreadsheet, Upload, Search, FileVideo, Link as LinkIcon, Plus, Info, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { formatTimeDisplay, sanitize, isStoreOpen } from '../utils/orderHelpers';

const AdminDashboard = () => {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [storeStatus, setStoreStatus] = useState({ isOpen: true, message: '', openTime: '10:00', closeTime: '22:00' });
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isManualCategory, setIsManualCategory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [urlType, setUrlType] = useState('image');
    const [lastBulkUploadIds, setLastBulkUploadIds] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Snacks',
        description: '',
        media: [], // Array of { url, type: 'image' | 'video' }
        isVeg: true
    });

    useEffect(() => {
        // Fetch Menu
        const q = query(collection(db, 'menu'), orderBy('name'));
        const unsubscribeMenu = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMenuItems(items);
            setLoading(false);
        });

        // Fetch Store Status
        const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
            if (docSnap.exists()) {
                setStoreStatus(prev => ({ ...prev, ...docSnap.data() }));
            }
        });

        return () => {
            unsubscribeMenu();
            unsubscribeSettings();
        };
    }, []);

    const handleStatusToggle = async () => {
        try {
            await setDoc(doc(db, 'settings', 'store'), {
                isOpen: !storeStatus.isOpen
            }, { merge: true });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error updating status: " + error.message);
        }
    };

    const handleTimingUpdate = (e) => {
        const { name, value } = e.target;
        setStoreStatus(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveTimings = async () => {
        try {
            await setDoc(doc(db, 'settings', 'store'), {
                openTime: sanitize(storeStatus.openTime || '10:00'),
                closeTime: sanitize(storeStatus.closeTime || '22:00')
            }, { merge: true });
            alert(`Store timings saved! Open: ${storeStatus.openTime} - Close: ${storeStatus.closeTime}`);
        } catch (error) {
            console.error("Error saving timings:", error);
            alert('Failed to save timings. Please try again.');
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleMediaUpload = async (e, type = 'image') => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formDataCloud = new FormData();
        formDataCloud.append('file', file);
        formDataCloud.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const resourceType = type === 'video' ? 'video' : 'image';

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
                {
                    method: 'POST',
                    body: formDataCloud,
                }
            );
            const data = await response.json();
            if (data.secure_url) {
                setFormData(prev => ({
                    ...prev,
                    media: [...(prev.media || []), { url: data.secure_url, type, yPos: 50, muted: type === 'video' }]
                }));
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert(`Failed to upload ${type}`);
        } finally {
            setUploading(false);
        }
    };

    const addMediaViaUrl = (url, type = 'image') => {
        if (!url) return;
        setFormData(prev => ({
            ...prev,
            media: [...(prev.media || []), { url, type, yPos: 50, muted: type === 'video' }]
        }));
    };

    const removeMedia = (index) => {
        setFormData(prev => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index)
        }));
    };

    const toggleMediaMuted = (idx) => {
        setFormData(prev => ({
            ...prev,
            media: prev.media.map((m, i) => i === idx ? { ...m, muted: !m.muted } : m)
        }));
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    alert("Excel file is empty!");
                    return;
                }

                const batch = writeBatch(db);
                const uploadedIds = [];

                data.forEach((row) => {
                    const docRef = doc(collection(db, 'menu'));
                    uploadedIds.push(docRef.id); // Track uploaded IDs
                    const primaryImage = row.Image || row.image || '';
                    batch.set(docRef, {
                        name: row.Name || row.name || 'Unnamed Item',
                        price: parseFloat(row.Price || row.price || 0),
                        category: row.Category || row.category || 'Snacks',
                        description: row.Description || row.description || '',
                        media: primaryImage ? [{ url: primaryImage, type: 'image' }] : [],
                        isVeg: row.isVeg === 'TRUE' || row.isVeg === true || row.IsVeg === true
                    });
                });

                await batch.commit();
                setLastBulkUploadIds(uploadedIds); // Store IDs for undo
                alert(`Successfully uploaded ${data.length} items! You can undo this upload if needed.`);
            } catch (error) {
                console.error("Bulk upload error:", error);
                alert("Failed to process Excel file. Please use Name, Price, Category, etc. as columns.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/admin');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMediaPositionChange = (idx, value) => {
        setFormData(prev => ({
            ...prev,
            media: prev.media.map((m, i) => i === idx ? { ...m, yPos: parseInt(value) } : m)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!formData.media || formData.media.length === 0) && !formData.image) {
            alert("Please add at least one image or video!");
            return;
        }
        setLoading(true);
        try {
            // Clean up media array - remove undefined properties
            const cleanMedia = formData.media?.map(m => ({
                url: m.url,
                type: m.type,
                ...(m.yPos !== undefined && { yPos: m.yPos }),
                ...(m.muted !== undefined && { muted: m.muted })
            })) || [];

            const data = {
                name: sanitize(formData.name),
                category: sanitize(formData.category),
                description: sanitize(formData.description || ''),
                price: parseFloat(formData.price) || 0,
                isVeg: formData.isVeg === true,
                media: cleanMedia
            };

            // Remove any undefined values from data object
            Object.keys(data).forEach(key => {
                if (data[key] === undefined) {
                    delete data[key];
                }
            });

            if (editingId) {
                await updateDoc(doc(db, 'menu', editingId), data);
            } else {
                await addDoc(collection(db, 'menu'), data);
            }
            resetForm();
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Error saving item. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', category: 'Snacks', description: '', media: [], isVeg: true });
        setEditingId(null);
        setIsFormOpen(false);
        setIsManualCategory(false);
        setUrlInput('');
    };

    const handleEdit = (item) => {
        const predefinedCategories = ['Snacks', 'Meals', 'Drinks'];
        const isManual = !predefinedCategories.includes(item.category); // Migrate legacy image to media if needed
        const media = (item.media || (item.image ? [{ url: item.image, type: 'image' }] : [])).map(m => ({
            ...m,
            yPos: m.yPos !== undefined ? m.yPos : 50,
            muted: m.muted !== undefined ? m.muted : (m.type === 'video' ? true : undefined)
        }));

        setFormData({ ...item, media });
        setEditingId(item.id);
        setIsManualCategory(isManual);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await deleteDoc(doc(db, 'menu', id));
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm("CRITICAL WARNING: This will DELETE ALL menu items. Are you absolutely sure?")) {
            if (window.confirm("FINAL CONFIRMATION: Once deleted, this cannot be undone. Proceed?")) {
                setLoading(true);
                try {
                    const batch = writeBatch(db);
                    menuItems.forEach((item) => {
                        batch.delete(doc(db, 'menu', item.id));
                    });
                    await batch.commit();
                    alert("All items deleted successfully.");
                } catch (error) {
                    console.error("Error deleting all items:", error);
                    alert("Failed to delete all items.");
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const handleExportData = () => {
        try {
            // Prepare data for export
            const exportData = menuItems.map(item => ({
                'Name': item.name,
                'Price': item.price,
                'Category': item.category,
                'Description': item.description || '',
                'Image': item.media?.[0]?.url || item.image || '',
                'isVeg': item.isVeg ? 'TRUE' : 'FALSE'
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Set column widths
            ws['!cols'] = [
                { wch: 30 }, // Name
                { wch: 10 }, // Price
                { wch: 15 }, // Category
                { wch: 50 }, // Description
                { wch: 60 }, // Image
                { wch: 10 }  // isVeg
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Menu Items');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `cafe_menu_${timestamp}.xlsx`;

            // Download file
            XLSX.writeFile(wb, filename);

            alert(`Successfully exported ${exportData.length} items to ${filename}`);
        } catch (error) {
            console.error("Export error:", error);
            alert("Failed to export data. Please try again.");
        }
    };

    const handleUndoBulkUpload = async () => {
        if (lastBulkUploadIds.length === 0) {
            alert("No recent bulk upload to undo!");
            return;
        }

        if (window.confirm(`This will delete ${lastBulkUploadIds.length} items from the last bulk upload. Continue?`)) {
            setLoading(true);
            try {
                const batch = writeBatch(db);
                lastBulkUploadIds.forEach((id) => {
                    batch.delete(doc(db, 'menu', id));
                });
                await batch.commit();
                setLastBulkUploadIds([]); // Clear the undo list
                alert(`Successfully deleted ${lastBulkUploadIds.length} items from last bulk upload.`);
            } catch (error) {
                console.error("Error undoing bulk upload:", error);
                alert("Failed to undo bulk upload. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '40px' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>Admin <span style={{ color: 'var(--primary)' }}>Dashboard</span></h2>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Logged in as: {currentUser?.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={handleExportData}
                                className="btn-primary"
                                style={{ background: '#27ae60', color: 'white' }}
                                title="Export all menu items to Excel"
                                disabled={menuItems.length === 0}
                            >
                                <FileSpreadsheet size={20} />
                                <span className="hide-mobile">Export Data</span>
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => document.getElementById('bulk-upload-input').click()}
                                className="btn-primary"
                                style={{ background: 'var(--secondary)', color: 'white' }}
                                title="Upload Excel (Columns: Name, Price, Category, Description, Image, isVeg)"
                            >
                                <Upload size={20} />
                                <span className="hide-mobile">Bulk Upload</span>
                            </button>
                            <input
                                id="bulk-upload-input"
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleBulkUpload}
                                style={{ display: 'none' }}
                            />
                        </div>
                        {lastBulkUploadIds.length > 0 && (
                            <button
                                onClick={handleUndoBulkUpload}
                                className="btn-primary"
                                style={{ background: '#e67e22', color: 'white' }}
                                title={`Undo last bulk upload (${lastBulkUploadIds.length} items)`}
                            >
                                <X size={20} />
                                <span className="hide-mobile">Undo Upload</span>
                            </button>
                        )}
                        <button onClick={() => setIsFormOpen(true)} className="btn-primary">
                            <PlusCircle size={20} />
                            Add Item
                        </button>
                        <button onClick={handleLogout} className="btn-primary" style={{ background: '#e74c3c' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats & Store Control */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                        <h4 style={{ color: 'var(--text-light)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Items</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>{menuItems.length}</p>
                    </div>

                    <div className="glass-card" style={{
                        padding: '20px',
                        textAlign: 'center',
                        border: storeStatus.isOpen ? '1px solid #2ecc71' : '1px solid #e74c3c',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <h4 style={{ color: 'var(--text-light)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Store Control</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    fontWeight: '800',
                                    color: (storeStatus.isOpen && isStoreOpen(storeStatus.openTime, storeStatus.closeTime)) ? '#2ecc71' : '#e74c3c',
                                    fontSize: '1.2rem'
                                }}>
                                    {(storeStatus.isOpen && isStoreOpen(storeStatus.openTime, storeStatus.closeTime)) ? 'OPEN' : 'CLOSED'}
                                </span>
                                <button
                                    onClick={handleStatusToggle}
                                    className="btn-primary"
                                    style={{
                                        padding: '5px 15px',
                                        fontSize: '0.8rem',
                                        background: storeStatus.isOpen ? '#e74c3c' : '#2ecc71'
                                    }}
                                >
                                    {storeStatus.isOpen ? 'Force Close' : 'Manual Open'}
                                </button>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', opacity: 0.8 }}>
                                Status: {(storeStatus.isOpen && isStoreOpen(storeStatus.openTime, storeStatus.closeTime)) ? 'Currently calculating as OPEN' : (storeStatus.isOpen ? 'Outside business hours' : 'Manually forced CLOSED')}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center', alignItems: 'flex-end' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block' }}>Open Time</label>
                                <input
                                    type="time"
                                    name="openTime"
                                    value={storeStatus.openTime || '10:00'}
                                    onChange={handleTimingUpdate}
                                    style={{ padding: '2px 5px', borderRadius: '5px', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block' }}>Close Time</label>
                                <input
                                    type="time"
                                    name="closeTime"
                                    value={storeStatus.closeTime || '22:00'}
                                    onChange={handleTimingUpdate}
                                    style={{ padding: '2px 5px', borderRadius: '5px', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}
                                />
                                <span style={{ fontSize: '10px', display: 'block', color: 'var(--text-light)', opacity: 0.7 }}>Tip: 12:00 AM for midnight</span>
                            </div>
                            <button
                                onClick={handleSaveTimings}
                                className="btn-primary"
                                style={{
                                    padding: '5px 10px',
                                    fontSize: '0.7rem',
                                    background: 'var(--primary)',
                                    height: 'fit-content'
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <h3>Menu Items</h3>
                            {menuItems.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '0.75rem',
                                        background: '#e74c3c22',
                                        color: '#e74c3c',
                                        borderRadius: '6px',
                                        border: '1px solid #e74c3c'
                                    }}
                                >
                                    <Trash2 size={12} style={{ marginRight: '5px' }} />
                                    Delete All
                                </button>
                            )}
                        </div>
                        <div style={{ position: 'relative', minWidth: '250px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 40px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.5)',
                                    fontSize: '0.9rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={40} /></div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Image</th>
                                    <th style={{ padding: '12px' }}>Name</th>
                                    <th style={{ padding: '12px' }}>Category</th>
                                    <th style={{ padding: '12px' }}>Price</th>
                                    <th style={{ padding: '12px' }}>Type</th>
                                    <th style={{ padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menuItems
                                    .filter(item =>
                                        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        item.category.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map(item => {
                                        const thumbnail = item.media?.[0]?.url || item.image;
                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '12px' }}>
                                                    {thumbnail ? (
                                                        <img src={thumbnail} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', objectPosition: `center ${item.media?.[0]?.yPos || 50}%`, border: '1px solid var(--glass-border)' }} />
                                                    ) : (
                                                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(231, 76, 60, 0.1)', border: '1px dashed #e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                            <ImageIcon size={20} color="#e74c3c" />
                                                            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white', fontSize: '10px', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }} title="Photo Missing">!</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: '600' }}>{item.name}</td>
                                                <td style={{ padding: '12px' }}>{item.category}</td>
                                                <td style={{ padding: '12px', fontWeight: '700', color: 'var(--primary)' }}>₹{item.price}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '4px 8px',
                                                        borderRadius: '20px',
                                                        background: item.isVeg ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                                                        color: item.isVeg ? '#2ecc71' : '#e74c3c',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {item.isVeg ? 'VEG' : 'NON-VEG'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button onClick={() => handleEdit(item)} style={{ color: '#3498db' }}><Edit2 size={18} /></button>
                                                        <button onClick={() => handleDelete(item.id)} style={{ color: '#e74c3c' }}><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Add/Edit Modal */}
                {isFormOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '20px'
                    }}>
                        <div className="glass-card animate-fade-in" style={{
                            width: '100%', maxWidth: '800px', padding: '30px', maxHeight: '90vh', overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                                <h3>{editingId ? 'Edit Item' : 'Add New Item'}</h3>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>AUTO-FIX ENABLED</span>
                                    <button onClick={resetForm}><X size={24} /></button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                {/* Form Column */}
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Item Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={inputStyle} placeholder="Ex. Spicy Burger" maxLength={100} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Price (₹)</label>
                                            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required style={inputStyle} placeholder="0" min="0" />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Category</label>
                                            <select
                                                name="category"
                                                value={isManualCategory ? 'Other' : formData.category}
                                                onChange={(e) => {
                                                    if (e.target.value === 'Other') {
                                                        setIsManualCategory(true);
                                                        setFormData(prev => ({ ...prev, category: '' }));
                                                    } else {
                                                        setIsManualCategory(false);
                                                        handleInputChange(e);
                                                    }
                                                }}
                                                style={inputStyle}
                                            >
                                                <option value="Snacks">Snacks</option>
                                                <option value="Meals">Meals</option>
                                                <option value="Drinks">Drinks</option>
                                                <option value="Other">Other (Manual Entry)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {isManualCategory && (
                                        <div className="animate-fade-in">
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Custom Category</label>
                                            <input
                                                type="text"
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                required
                                                style={inputStyle}
                                                placeholder="Ex. Ice Creams"
                                                maxLength={50}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Media Gallery</label>

                                        {/* Existing Media List */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                                            {formData.media?.map((m, idx) => (
                                                <div key={idx} style={{ position: 'relative' }}>
                                                    <div style={{ position: 'relative', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                                        {m.type === 'image' ? (
                                                            <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `center ${m.yPos || 50}%` }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <FileVideo color="white" size={16} />
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMedia(idx)}
                                                            style={{ position: 'absolute', top: '1px', right: '1px', background: 'rgba(231, 76, 60, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                    {m.type === 'image' && (
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={m.yPos || 50}
                                                            onChange={(e) => handleMediaPositionChange(idx, e.target.value)}
                                                            style={{ width: '100%', height: '4px', marginTop: '4px' }}
                                                            title="Adjust vertical position"
                                                        />
                                                    )}
                                                    {m.type === 'video' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleMediaMuted(idx)}
                                                            style={{
                                                                width: '100%',
                                                                marginTop: '4px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px',
                                                                fontSize: '0.65rem',
                                                                background: m.muted ? '#eee' : '#e1f5fe',
                                                                padding: '2px',
                                                                borderRadius: '4px',
                                                                color: m.muted ? '#666' : '#039be5'
                                                            }}
                                                        >
                                                            {m.muted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                                                            {m.muted ? 'Muted' : 'Sound On'}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" onClick={() => document.getElementById('image-upload').click()} className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--secondary)' }} disabled={uploading}>
                                                    {uploading ? <Loader2 className="animate-spin" size={12} /> : <ImageIcon size={12} />} Add Img
                                                </button>
                                                <button type="button" onClick={() => document.getElementById('video-upload').click()} className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--secondary)' }} disabled={uploading}>
                                                    {uploading ? <Loader2 className="animate-spin" size={12} /> : <FileVideo size={12} />} Add Vid
                                                </button>
                                                <input id="image-upload" type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} style={{ display: 'none' }} />
                                                <input id="video-upload" type="file" accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} style={{ display: 'none' }} />
                                            </div>

                                            <div style={{ display: 'flex', width: '100%', gap: '5px', marginTop: '5px' }}>
                                                <input type="text" placeholder="URL..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '0.85rem' }} />
                                                <select value={urlType} onChange={(e) => setUrlType(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px', fontSize: '0.85rem' }}>
                                                    <option value="image">Img</option>
                                                    <option value="video">Vid</option>
                                                </select>
                                                <button type="button" onClick={() => { if (urlInput) { addMediaViaUrl(urlInput, urlType); setUrlInput(''); } }} className="btn-primary" style={{ padding: '6px 10px' }}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Description</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" style={inputStyle} placeholder="Short description..." maxLength={500}></textarea>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="checkbox" name="isVeg" checked={formData.isVeg} onChange={handleInputChange} id="isVeg" />
                                        <label htmlFor="isVeg" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Vegetarian Item</label>
                                    </div>

                                    <button type="submit" className="btn-primary" style={{ justifyContent: 'center', width: '100%', marginTop: '5px' }}>
                                        {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {editingId ? 'Update Item' : 'Add Item'}</>}
                                    </button>
                                </form>

                                {/* Live Preview Column */}
                                <div className="hide-mobile" style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '30px' }}>
                                    <h4 style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-light)', textAlign: 'center' }}>Live Preview (On Menu)</h4>
                                    <div className="glass-card" style={{ padding: '15px', width: '100%', maxWidth: '280px', margin: '0 auto', opacity: 0.9 }}>
                                        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', height: '220px', marginBottom: '15px', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {formData.media?.length > 0 ? (
                                                formData.media[0].type === 'image' ? (
                                                    <img src={formData.media[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `center ${formData.media[0].yPos || 50}%` }} alt="Preview" />
                                                ) : (
                                                    <video
                                                        src={formData.media[0].url}
                                                        autoPlay
                                                        muted={formData.media[0].muted !== false}
                                                        loop
                                                        playsInline
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                )
                                            ) : (
                                                <ImageIcon size={40} color="#ccc" />
                                            )}
                                            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: formData.isVeg ? '#2ecc71' : '#e74c3c' }}></div>
                                                {formData.isVeg ? 'VEG' : 'NON-VEG'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{formData.name || 'Item Name'}</h3>
                                            <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>₹{formData.price || '0'}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>{formData.description || 'Description will appear here...'}</p>
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '20px', textAlign: 'center' }}>
                                        <Info size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                        Images are automatically cropped (Auto-Fixed) to fit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(255,255,255,0.8)',
    fontSize: '1rem',
    outline: 'none'
};

export default AdminDashboard;
