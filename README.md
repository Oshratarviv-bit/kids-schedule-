<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>ProPixel 3D - Shared Channel Edition</title>
    <style>
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: white; overflow: hidden; }
        .overlay { position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2000; }
        .box { background: #1a1a1a; padding: 25px; border-radius: 20px; border: 2px solid #e94560; text-align: center; width: 350px; box-shadow: 0 0 20px rgba(233,69,96,0.3); }
        .btn { padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin: 5px 0; background: #e94560; color: white; width: 100%; transition: 0.2s; }
        .btn-blue { background: #00d4ff; color: black; }
        
        input { width: 90%; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: none; background: #222; color: white; }

        /* ממשק עורך */
        #editor-ui { position: absolute; top: 10px; right: 10px; display: none; flex-direction: column; gap: 8px; z-index: 10; }
        .tool-section { background: rgba(0,0,0,0.85); padding: 12px; border-radius: 15px; border: 1px solid #e94560; width: 210px; }

        /* ערוץ משותף */
        #user-channel { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 15px; border: 1px solid #00d4ff; display: none; z-index: 50; text-align: center; }
        #profile-pic-display { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #00d4ff; margin-bottom: 5px; }
    </style>
</head>
<body>

<div id="screen-setup" class="overlay">
    <div class="box">
        <h2 style="color:#e94560;">הגדרת ערוץ 🚀</h2>
        <input type="text" id="name-input" placeholder="שם הערוץ שלך...">
        <input type="text" id="shared-code" placeholder="קוד ערוץ משותף (אופציונלי)">
        <p style="font-size: 11px;">אם תכניס קוד שחבר נתן לך, תעבדו יחד!</p>
        
        <label style="background:#333; padding:10px; border-radius:8px; cursor:pointer; display:block; margin-bottom:10px;">
            📸 בחר תמונה
            <input type="file" id="file-input" accept="image/*" style="display:none;" onchange="previewProfile(event)">
        </label>
        <button class="btn" onclick="startApp()">התחל ליצור!</button>
    </div>
</div>

<div id="user-channel">
    <img id="profile-pic-display" src="https://via.placeholder.com/60">
    <div id="display-name" style="font-weight:bold; color:#00d4ff;"></div>
    <div id="shared-tag" style="font-size:10px; color:#ff9f43; display:none;">✨ ערוץ משותף פעיל</div>
    <div style="font-size:11px;">📂 סה"כ פרויקטים: <span id="p-count">0</span></div>
</div>

<div id="editor-ui">
    <div class="tool-section">
        <h4>🔨 בנייה</h4>
        <button class="btn" onclick="addObject('cube')">הוסף קוביה</button>
    </div>
    <div class="tool-section">
        <h4>📐 עריכה</h4>
        <button class="btn btn-blue" onclick="transform(1.2)">הגדל (+)</button>
        <button class="btn btn-blue" onclick="transform(0.8)">הקטן (-)</button>
        <button class="btn" style="background:#ff4757" onclick="removeLast()">מחק</button>
    </div>
    <div class="tool-section">
        <h4>📢 שיתוף</h4>
        <button class="btn" style="background:#2ed573" onclick="saveProject()">פרסם לערוץ המשותף</button>
    </div>
</div>

<script type="module">
    import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

    let scene, camera, renderer, allObjects = [], lastSelected = null;
    let currentChannelKey = 'pixel_private';

    window.previewProfile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => document.getElementById('profile-pic-display').src = reader.result;
            reader.readAsDataURL(file);
        }
    };

    window.startApp = () => {
        const name = document.getElementById('name-input').value;
        const code = document.getElementById('shared-code').value;
        
        if(!name
