require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ၁။ MongoDB Atlas Connection
const mongoURI = process.env.MONGODB_URI;
console.log("--- Environment Variables Check ---");
console.log("DB URI:", process.env.MONGODB_URI);
console.log("PORT:", process.env.PORT);
console.log("----------------------------------");

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => console.log("❌ Connection Error: ", err));

// ၂။ အဆင့်မြှင့်တင်ထားသော Schema နှင့် Model
const projectSchema = new mongoose.Schema({
    major: String,
    title: String,
    year: String,        // Academic Year (e.g., "2023-24")
    rating: { type: Number, default: 0 },
    intro: String,
    aim: [String],       // Array of Strings
    theory: String,
    process: [String],   // Array of Strings
    con: String,
    authors: [String],   // Array of Strings
    img: [String],       // Array of Image URLs (ပုံအားလုံး သိမ်းဆည်းရန်)
    createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// ၃။ Static Files serving
app.use(express.static(path.join(__dirname, '.')));

// ၄။ API Routes

// (က) Project အားလုံးကို ယူရန် (Frontend gallery အတွက်)
app.get('/api/projects', async (req, res) => {
    try {
        // နောက်ဆုံးတင်တဲ့ project ကို အရင်ပြချင်ရင် .sort({ createdAt: -1 }) ထည့်နိုင်ပါတယ်
        const projects = await Project.find().sort({ createdAt: -1 });
        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ error: "Data ယူ၍ မရပါ" });
    }
});

// (ခ) ID ဖြင့် တစ်ခုချင်းစီ ရှာရန် (Detail page အတွက်)
app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "ရှာမတွေ့ပါ" });
        res.status(200).json(project);
    } catch (err) {
        res.status(500).json({ error: "ID ရှာဖွေရာတွင် အမှားရှိနေပါသည်" });
    }
});

// (ဂ) Project အသစ်ထည့်ရန် (Admin Dashboard အတွက်)
app.post('/api/add-project', async (req, res) => {
    try {
        const newProject = new Project(req.body);
        await newProject.save();
        res.status(200).json({ message: "Project အသစ်ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!" });
    } catch (err) {
        res.status(500).json({ error: "သိမ်းဆည်းရာတွင် အမှားရှိနေပါသည်", details: err.message });
    }
});

// ၅။ Catch-all Route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ၆။ Server Port
const PORT = process.env.PORT || 5000;
// Local မှာ စမ်းသပ်ရန်အတွက်သာ (Vercel မှာဆိုရင် module.exports က အလုပ်လုပ်ပါလိမ့်မယ်)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}

module.exports = app;