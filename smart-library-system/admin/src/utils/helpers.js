// Constants removed - not used in this helper file

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    available: 'success',
    issued: 'warning',
    suspended: 'warning',
    damaged: 'error',
    lost: 'error',
    blocked: 'error',
    pending: 'info',
    paid: 'success',
    approved: 'success',
    completed: 'success',
    returned: 'success',
    overdue: 'error',
    waived: 'info',
  };
  return colors[status] || 'default';
};

// Calculate fine
export const calculateFine = (dueDate, returnDate, finePerDay) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  const daysOverdue = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysOverdue * finePerDay);
};

// Generate QR Code
export const generateQRCode = (text, size = 200) => {
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}`;
};

// Validate Email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate Phone
export const validatePhone = (phone) => {
  const re = /^[\d\s+()\\-]{10,}$/;
  return re.test(phone);
};

// Truncate text
export const truncateText = (text, length = 50) => {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
};

// Sort function
export const sortData = (data, sortBy, sortOrder = 'asc') => {
  const sorted = [...data].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
};

// Filter function
export const filterData = (data, filters) => {
  return data.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const itemValue = String(item[key]).toLowerCase();
      const filterValue = String(value).toLowerCase();
      return itemValue.includes(filterValue);
    });
  });
};
