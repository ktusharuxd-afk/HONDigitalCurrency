#!/bin/bash
FONT_CSS='<style>@font-face{font-family:Ionicons;src:url(https://unpkg.com/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf) format("truetype");}</style>'
sed -i "s|</head>|${FONT_CSS}</head>|" dist/index.html
