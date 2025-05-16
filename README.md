# Postly - A Little Blog Social Network

This is a blog-based social network project where users can view posts without needing to log in. However, by authenticating with Google, they can create posts, like them, and leave comments.

## Technologies Used

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- Flask
- Python

## Installation and Execution

### Prerequisites

- Node.js and npm installed
- Python and virtualenv installed

### Clone the Repository

```bash
   git clone https://github.com/ChrisUBS/postly
```

### Frontend Installation and Execution

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Installation and Execution

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python server.py
   ```

## Features

- **Public Browsing**: Any user can view posts without logging in.
- **Google Authentication**: To create posts, comment, and like, users must log in with Google.
- **Post Creation**: Authenticated users can publish content.
- **Likes and Comments**: Interact with posts through likes and comments.

## License

This project is licensed under the GNU General Public License (GPL).
