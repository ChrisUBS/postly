# Libraries
from flask import Flask, request, jsonify
from http import HTTPStatus
from config import db
from flask_cors import CORS
from dotenv import load_dotenv
import os, datetime, re
from bson.objectid import ObjectId
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from werkzeug.security import generate_password_hash, check_password_hash
load_dotenv()

app = Flask(__name__)
CORS(app)  # Warning: this enables CORS for all origins

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "your-secret-key")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=7)
jwt = JWTManager(app)

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

##############################################
################## Utils #####################
##############################################

# Fix the id from MongoDB
def fix_id(obj):
    if obj and "_id" in obj:
        obj["_id"] = str(obj["_id"])
    return obj

# Fix all IDs in an array of objects
def fix_ids(objects):
    return [fix_id(obj) for obj in objects]

# Get user data from database
def get_user_data(user_id):
    user = db.users.find_one({"userId": user_id})
    if user:
        return {
            "userId": user["userId"],
            "name": user["name"],
            "email": user.get("email"),
            "profilePicture": user.get("profilePicture")
        }
    return None

# Create slug from title
def create_slug(title):
    # Convert to lowercase and replace spaces with hyphens
    slug = title.lower().replace(" ", "-")
    # Remove special characters
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    return slug

# Calculate read time
def calculate_read_time(content):
    words = len(content.split())
    return max(1, round(words / 200))  # Assuming 200 words per minute

##############################################
################ ENDPOINTS ###################
##############################################

# Home page
@app.get("/")
def home():
    return "<h1>Postly API - This is my backend.</h1>", HTTPStatus.OK

# Login with Google Auth
@app.post("/api/auth/login")
def login():
    try:
        data = request.get_json()
        token = data.get("token")
        
        if not token:
            return {"error": "Token is required"}, HTTPStatus.BAD_REQUEST
        
        # Verify Google's token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        # Get user's information
        user_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        # Create or update user in the DB
        user = {
            "userId": user_id,
            "name": name,
            "email": email,
            "profilePicture": picture,
            "lastLogin": datetime.datetime.now(datetime.UTC).isoformat()
        }
        
        db.users.update_one(
            {"userId": user_id},
            {"$set": user},
            upsert=True
        )
        
        # Generar token JWT
        access_token = create_access_token(identity=user_id)
        
        return {"accessToken": access_token, "user": user}, HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.UNAUTHORIZED

# Register with email and password
@app.post("/api/auth/register")
def register():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        name = data.get("name", "")

        if not email or not password:
            return {"error": "Email and password are required"}, HTTPStatus.BAD_REQUEST

        # Check if user already exists
        existing = db.users.find_one({"email": email})
        if existing:
            return {"error": "User already exists"}, HTTPStatus.BAD_REQUEST

        hashed_password = generate_password_hash(password)

        new_user = {
            "userId": str(ObjectId()),
            "name": name,
            "email": email,
            "password": hashed_password,
            "profilePicture": None,
            "lastLogin": datetime.datetime.now(datetime.UTC).isoformat()
        }

        db.users.insert_one(new_user)

        # Create JWT
        token = create_access_token(identity=new_user["userId"])

        return {
            "accessToken": token,
            "user": {
                "userId": new_user["userId"],
                "name": new_user["name"],
                "email": new_user["email"]
            }
        }, HTTPStatus.CREATED

    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Login with email and password
@app.post("/api/auth/login/email")
def login_email():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {"error": "Email and password are required"}, HTTPStatus.BAD_REQUEST

        user = db.users.find_one({"email": email})
        if not user:
            return {"error": "Invalid credentials"}, HTTPStatus.UNAUTHORIZED

        # Validate password
        if not check_password_hash(user.get("password", ""), password):
            return {"error": "Invalid credentials"}, HTTPStatus.UNAUTHORIZED

        token = create_access_token(identity=user["userId"])

        return {
            "accessToken": token,
            "user": {
                "userId": user["userId"],
                "name": user.get("name"),
                "email": user["email"],
                "profilePicture": user.get("profilePicture")
            }
        }, HTTPStatus.OK

    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# GET (get all posts)
@app.get("/api/posts")
def get_posts():
    try:
        # Pagination and filtered options
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        status = request.args.get("status", "published")
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Create filter
        filter_query = {"status": status}
        
        # Get total posts for pagination
        total_posts = db.posts.count_documents(filter_query)
        
        # Get assigned posts
        cursor = db.posts.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
        posts = fix_ids(list(cursor))
        
        response = {
            "posts": posts,
            "pagination": {
                "total": total_posts,
                "page": page,
                "limit": limit,
                "totalPages": (total_posts + limit - 1) // limit
            }
        }
        
        return jsonify(response), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# GET (get post by id)
@app.get("/api/posts/<id>")
def get_post_by_id(id):
    try:
        post = db.posts.find_one({"_id": ObjectId(id)})
        if post:
            # Increment views counter
            db.posts.update_one({"_id": ObjectId(id)}, {"$inc": {"views": 1}})
            post["views"] += 1
            return jsonify(fix_id(post)), HTTPStatus.OK
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# GET (get post by slug)
@app.get("/api/posts/slug/<slug>")
def get_post_by_slug(slug):
    try:
        post = db.posts.find_one({"slug": slug})
        if post:
            # Increment views counter
            db.posts.update_one({"_id": post["_id"]}, {"$inc": {"views": 1}})
            post["views"] += 1  
            return jsonify(fix_id(post)), HTTPStatus.OK
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# POST (create a new post)
@app.post("/api/posts")
@jwt_required()
def save_post():
    try:
        post_data = request.get_json()
        
        # Basic verification
        if not post_data.get("title") or not post_data.get("content"):
            return {"error": "Title and content are required"}, HTTPStatus.BAD_REQUEST
        
        # Get authenticated user information
        user_id = get_jwt_identity()
        user_data = get_user_data(user_id)
        
        if not user_data:
            return {"error": "User not found"}, HTTPStatus.UNAUTHORIZED
        
        # Create a slug from the title
        slug = create_slug(post_data["title"])
        
        # Verify if the slug exists
        existing_post = db.posts.find_one({"slug": slug})
        if existing_post:
            # Add unique suffix if it exist
            slug = f"{slug}-{str(ObjectId())[-6:]}"
        
        # Calculate reading time
        read_time = calculate_read_time(post_data["content"])
        
        # Create post
        now = datetime.datetime.now(datetime.UTC).isoformat()
        new_post = {
            "title": post_data["title"],
            "content": post_data["content"],
            "author": user_data,
            "slug": slug,
            "createdAt": now,
            "updatedAt": now,
            "status": post_data.get("status", "published"),
            "readTime": read_time,
            "views": 0,
            "likes": 0,
            "comments": [],
            # Add cover image if It is present
            "coverImage": post_data.get("coverImage") 
        }
        
        result = db.posts.insert_one(new_post)
        new_post["_id"] = str(result.inserted_id)
        
        return jsonify(new_post), HTTPStatus.CREATED
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# PUT (update a post)
@app.put("/api/posts/<id>")
@jwt_required()
def update_post(id):
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Verify if the post exist and It belongs to the user
        post = db.posts.find_one({"_id": ObjectId(id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
            
        if post["author"]["userId"] != user_id:
            return {"error": "Unauthorized: you can only edit your own posts"}, HTTPStatus.UNAUTHORIZED
        
        # Prepare data to update
        update_data = {}
        if "title" in data:
            update_data["title"] = data["title"]
            # Update slug ig the title changes
            new_slug = create_slug(data["title"])
            
            # Verify if the new slug already exists and It's different from the current one
            if new_slug != post.get("slug"):
                existing_post = db.posts.find_one({"slug": new_slug, "_id": {"$ne": ObjectId(id)}})
                if existing_post:
                    # Add a unique suffix if the slug already exists
                    new_slug = f"{new_slug}-{str(ObjectId())[-6:]}"
            
            update_data["slug"] = new_slug
            
        if "content" in data:
            update_data["content"] = data["content"]
            # Recalculate reading time if content changes
            update_data["readTime"] = calculate_read_time(data["content"])
            
        if "status" in data:
            update_data["status"] = data["status"]
            
        # Manage the cover image
        if "coverImage" in data:
            update_data["coverImage"] = data["coverImage"]  # Puede ser una URL o null
            
        # Update modification date
        update_data["updatedAt"] = datetime.datetime.now(datetime.UTC).isoformat()
        
        result = db.posts.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        
        if result.matched_count:
            # Get the updated post to return it
            updated_post = db.posts.find_one({"_id": ObjectId(id)})
            return jsonify(fix_id(updated_post)), HTTPStatus.OK
            
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# DELETE (delete a post)
@app.delete("/api/posts/<id>")
@jwt_required()
def delete_post(id):
    try:
        user_id = get_jwt_identity()
        
        # Check if the post exists and belongs to the user
        post = db.posts.find_one({"_id": ObjectId(id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
            
        if post["author"]["userId"] != user_id:
            return {"error": "Unauthorized: you can only delete your own posts"}, HTTPStatus.UNAUTHORIZED
        
        result = db.posts.delete_one({"_id": ObjectId(id)})
        if result.deleted_count:
            # Also remove associated likes
            db.post_likes.delete_many({"postId": id})
            return {"message": "Post deleted successfully"}, HTTPStatus.OK
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# GET (get comments for a post)
@app.get("/api/posts/<post_id>/comments")
def get_comments(post_id):
    try:
        post = db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
        
        comments = post.get("comments", [])
        return jsonify(comments), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# POST (create a comment for a post)
@app.post("/api/posts/<post_id>/comments")
@jwt_required()
def create_comment(post_id):
    try:
        comment_data = request.get_json()
        
        # Basic validation
        if not comment_data.get("content"):
            return {"error": "Comment content is required"}, HTTPStatus.BAD_REQUEST
        
        # Get information about the authenticated user
        user_id = get_jwt_identity()
        user_data = get_user_data(user_id)
        
        if not user_data:
            return {"error": "User not found"}, HTTPStatus.UNAUTHORIZED
        
        # Create the comment
        comment = {
            "_id": str(ObjectId()),  # Generar ID único para el comentario
            "content": comment_data["content"],
            "author": {
                "userId": user_data["userId"],
                "name": user_data["name"],
                "profilePicture": user_data.get("profilePicture")
            },
            "createdAt": datetime.datetime.now(datetime.UTC).isoformat(),
            "likes": 0
        }
        
        # Add the comment to the post
        result = db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"comments": comment}}
        )
        
        if result.matched_count:
            return jsonify(comment), HTTPStatus.CREATED
        return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# DELETE (delete a comment from a post)
@app.delete("/api/posts/<post_id>/comments/<comment_id>")
@jwt_required()
def delete_comment(post_id, comment_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify if the comment exists
        post = db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
        
        # Find the comment
        comment = next((c for c in post.get("comments", []) if c["_id"] == comment_id), None)
        if not comment:
            return {"error": "Comment not found"}, HTTPStatus.NOT_FOUND
        
        # Check permissions: only the comment author or the post author can delete it
        if comment["author"]["userId"] != user_id and post["author"]["userId"] != user_id:
            return {"error": "Unauthorized: you can only delete your own comments"}, HTTPStatus.UNAUTHORIZED
        
        # Delete the comment
        result = db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"comments": {"_id": comment_id}}}
        )
        
        if result.modified_count:
            return {"message": "Comment deleted successfully"}, HTTPStatus.OK
        return {"error": "Comment not found"}, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint to like a post
@app.post("/api/posts/<post_id>/like")
@jwt_required()
def like_post(post_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify if the post exists
        post = db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            return {"error": "Post not found"}, HTTPStatus.NOT_FOUND
        
        # Add the like and user to the likes list (if it doesn't already exist)
        if not db.post_likes.find_one({"postId": post_id, "userId": user_id}):
            db.post_likes.insert_one({
                "postId": post_id,
                "userId": user_id,
                "createdAt": datetime.datetime.now(datetime.UTC).isoformat()
            })
            
            # Increment likes counter
            db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"likes": 1}}
            )
            
            return {"message": "Post liked successfully"}, HTTPStatus.OK
        else:
            return {"message": "Post already liked"}, HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint to remove like from a post
@app.delete("/api/posts/<post_id>/like")
@jwt_required()
def unlike_post(post_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify if the like exists
        if db.post_likes.find_one({"postId": post_id, "userId": user_id}):
            # Eliminar el like
            db.post_likes.delete_one({"postId": post_id, "userId": user_id})
            
            # Decrease like counter
            db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"likes": -1}}
            )
            
            return {"message": "Post unliked successfully"}, HTTPStatus.OK
        else:
            return {"message": "Post was not liked"}, HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint to check if a user liked a post
@app.get("/api/posts/<post_id>/like")
@jwt_required()
def check_like(post_id):
    try:
        user_id = get_jwt_identity()
        
        # Verify if the like exists
        like = db.post_likes.find_one({"postId": post_id, "userId": user_id})
        
        return {"liked": like is not None}, HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint to find posts
@app.get("/api/posts/search")
def search_posts():
    try:
        query = request.args.get("q", "")
        if not query:
            return {"error": "Search query is required"}, HTTPStatus.BAD_REQUEST
        
        # Search in title and content
        cursor = db.posts.find({
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"content": {"$regex": query, "$options": "i"}}
            ],
            "status": "published"  # Only search published posts
        }).sort("createdAt", -1)
        
        results = fix_ids(list(cursor))
        return jsonify(results), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint to get posts from a specific user
@app.get("/api/users/<user_id>/posts")
def get_user_posts(user_id):
    try:
        # Filtering and pagination options
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        status = request.args.get("status", "published")
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Create filter
        filter_query = {"author.userId": user_id, "status": status}
        
        # Get total posts for pagination
        total_posts = db.posts.count_documents(filter_query)
        
        # Get paginated posts
        cursor = db.posts.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
        posts = fix_ids(list(cursor))
        
        response = {
            "posts": posts,
            "pagination": {
                "total": total_posts,
                "page": page,
                "limit": limit,
                "totalPages": (total_posts + limit - 1) // limit
            }
        }
        
        return jsonify(response), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint to get posts from the authenticated user (including drafts)
@app.get("/api/users/me/posts")
@jwt_required()
def get_my_posts():
    try:
        user_id = get_jwt_identity()
        
        # Filtering and pagination options
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        status = request.args.get("status", None)  # Opcional: filtrar por estado
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Create filter
        filter_query = {"author.userId": user_id}
        if status:
            filter_query["status"] = status
        
        # Get total posts for pagination
        total_posts = db.posts.count_documents(filter_query)
        
        # Get paginated posts
        cursor = db.posts.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
        posts = fix_ids(list(cursor))
        
        response = {
            "posts": posts,
            "pagination": {
                "total": total_posts,
                "page": page,
                "limit": limit,
                "totalPages": (total_posts + limit - 1) // limit
            }
        }
        
        return jsonify(response), HTTPStatus.OK
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.BAD_REQUEST

# Endpoint to check authentication status
@app.get("/api/auth/check")
@jwt_required()
def check_auth():
    try:
        user_id = get_jwt_identity()
        user_data = get_user_data(user_id)
        
        if user_data:
            return jsonify(user_data), HTTPStatus.OK
        return {"error": "User not found"}, HTTPStatus.UNAUTHORIZED
    except Exception as e:
        return {"error": str(e)}, HTTPStatus.UNAUTHORIZED

##############################################
################# RUN SERVER #################
##############################################

if __name__ == "__main__":
    app.run(
        host=(os.getenv("HOST", "127.0.0.1")), 
        port=int(os.getenv("PORT", 5000)), 
        debug=bool(os.getenv("DEBUG_MODE", False))
    )