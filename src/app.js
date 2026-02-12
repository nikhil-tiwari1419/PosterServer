const express = require('express');
const multer = require('multer'); // it help express to read file 
const uploadFile = require('./services/storage.service')
const postmodel = require('./models/post.model')
const cors = require('cors')

const app = express();

app.use(cors({
    origin: process.env.PORT, // Replace with your frontend URL
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies to be sent with requests
}));

app.use(express.json());

//multer setup for file upload, we are using memory storage to store the file in memory before uploading it to cloudinary or any other cloud storage service. We can also use disk storage to store the file on the server before uploading it to cloudinary or any other cloud storage service. But in this case we are using memory storage because we don't want to store the file on the server. We want to upload it directly to cloudinary or any other cloud storage service.
const uplode = multer({ storage: multer.memoryStorage() })

app.post('/create-post', uplode.single("image"), async (req, res) => {

    try {
        // Debug : Log what we receive in the request
        console.log("Request Received");
        // console.log("Received file:", req.file);
        // console.log("Received body:", req.body);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No  file uploaded"
            });
        }

        if (!req.body.caption) {
            return res.status(400).json({
                success: false,
                message: "Caption is required "
            });
        }

        const result = await uploadFile(req.file.buffer); // Upload file to cloud storage [imagekit] and get the URL

        const post = await postmodel.create({
            image: result.url,
            caption: req.body.caption.trim()
        });

        return res.status(201).json({
            success: true,
            message: "post created succesfully",
            post: post
        });

    } catch (error) {
        console.log("Error in /create-post:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating post",
            error: error.message
        });
    }
});

app.get('/get-posts', async (req, res) => {
    try {
        // CORRECT: Use .sort() not .toSorted()
        const posts = await postmodel.find().sort({ createdAt: -1 });

        // console.log('Posts fetched:', posts.length); // Debug log

        return res.status(200).json({
            success: true,
            message: "Posts fetched successfully",
            posts: posts
        });

    } catch (error) {
        // console.error('Error in /get-posts:', error); // See the actual error
        return res.status(500).json({
            success: false,
            message: "Error fetching posts",
            error: error.message
        });
    }
});

app.patch('/update-post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { caption } = req.body;

        if (!caption || caption.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Caption is required"
            });
        }

        const updatePost = await postmodel.findByIdAndUpdate(
            id,
            { caption: caption.trim() }, // only update caption 
            { new: true } //return updated document 
        );

        if (!updatePost) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Post update successfully",
            post: updatePost
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: "Error updating post",
            error: error.message
        });
    }
});

app.delete('/delete-post/:id', async (req, res) => {
    console.log("delete post called / API hit")

    try {
        const { id } = req.params;
        const deletedPost = await postmodel.findByIdAndDelete(id);

        if (!deletedPost) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "post deleted succesfully",
            deletedPost: deletedPost
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting post",
            error: error.message
        });
    }
});

module.exports = app
