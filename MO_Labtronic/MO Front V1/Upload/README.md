# MO Front V1 - Website Upload Package

This folder contains all the necessary files for deploying the Manufacturing Orders (MO) management website.

## File Structure

```
Upload/
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── Account.html            # User account management
├── Add_MO.html            # Add new Manufacturing Order
├── Add_Proj.html          # Add new Project
├── Man_Order.html         # Manufacturing Order search
├── MO_Card.html           # MO details page
├── Proj_Card.html         # Project details page
├── Projects.html          # Projects listing
├── styles.css             # Main stylesheet
├── js/                    # JavaScript files
│   ├── auth.js           # Authentication utilities
│   ├── login.js          # Login page functionality
│   ├── dashboard.js      # Dashboard functionality
│   ├── account.js        # Account management
│   ├── add-mo.js         # Add MO functionality
│   ├── man-order.js      # MO search functionality
│   ├── mo-card.js        # MO details functionality
│   ├── projects.js       # Projects listing
│   └── proj-card.js      # Project details functionality
└── README.md             # This file
```

## Deployment Instructions

### For Web Hosting (cPanel, etc.)
1. Upload all files and folders to your web hosting root directory
2. Ensure the file structure is maintained
3. Make sure your web server supports HTML, CSS, and JavaScript files

### For Static Hosting (Netlify, Vercel, etc.)
1. Upload the entire Upload folder contents to your hosting platform
2. Set `index.html` as the default page
3. Ensure all file paths are preserved

### For Local Development Server
1. Navigate to the Upload folder
2. Start a local server (e.g., `python -m http.server 8000` or `npx serve`)
3. Access via `http://localhost:8000`

## Features Included

- **Authentication System**: Login/logout functionality
- **Role-Based Access Control**: Different features for different user roles
- **Manufacturing Orders Management**: Create, view, and manage MOs
- **Project Management**: Create and manage projects
- **User Account Management**: Profile and settings
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Geist Design System

## Dependencies

- **PocketBase**: Backend database (configured via JavaScript)
- **Geist Design System**: UI components and styling
- **Inter Font**: Typography (loaded from Google Fonts)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Notes

- All external resources (fonts, icons) are loaded from CDNs
- The website uses PocketBase as the backend - ensure your PocketBase instance is properly configured
- Favicon is set to use the Lab-Tronic logo from the production server
- All JavaScript files are minified and optimized for production

## Support

For technical support or questions about deployment, please refer to the main project documentation or contact the development team. 