// src/components/ui/theme.js

import {createTheme} from '@mui/material/styles';

export const theme =  createTheme({
    direction: 'rtl',
    palette:{
        mode:"dark",

        primary: {
      "main": "rgba(43, 140, 238, 1)",
      "950": "rgba(23, 37, 84, 1)",
      "900": "rgba(30, 58, 138, 1)",
      "800": "rgba(30, 64, 175, 1)",
      "700": "rgba(30, 64, 175, 1)",
      "600": "rgba(43, 140, 238, 1)",
      "500": "rgba(59, 130, 246, 1)",
      "400": "rgba(96, 165, 250, 1)",
      "300": "rgba(147, 197, 253, 1)",
      "200": "rgba(191, 219, 254, 1)",
      "100": "rgba(219, 234, 254, 1)",
      "50": "rgba(239, 246, 255, 1)",
    },

        neutral: {
      "main": "rgba(51, 65, 85, 1)",
      "950": "rgba(16, 25, 34, 1)",
      "900": "rgba(21, 28, 36, 1)",
      "800": "rgba(28, 38, 48, 1)",
      "750": "rgba(35, 45, 59, 1)" ,
      "700": "rgba(51, 65, 85, 1)",
      "600": "rgba(71, 85, 105, 1)",
      "500": "rgba(100, 116, 139, 1)",
      "400": "rgba(148, 163, 184, 1)",
      "300": "rgba(203, 213, 225, 1)",
      "200": "rgba(226, 232, 240, 1)",
      "100": "rgba(241, 245, 249, 1)",
      "50": "rgba(248, 250, 252, 1)",
    },
    white:{
      main:"rgba(255, 255, 255, 1)"
    },
    black:{
      main:"rgba(2, 6, 24, 1)"
    },
    success:{
      main:"rgba(0, 186, 136, 1)",
      "500":"rgba(0, 186, 136, 1)",
      "600":"rgba(0, 164, 120, 1)",
      "700":"rgba(0, 131, 100, 1)",
    },
    warning:{
      main:"rgba(244, 183, 64, 1)",
      "200":"rgba(255, 183, 126, 1)",
      "300":"rgba(244, 183, 64, 1)",
      "400":"rgba(243, 166, 44, 1)",
      "500":"rgba(236, 133, 20, 1)",
    },
    error:{
      main:"rgba(248, 113, 113, 1)",
      "400":"rgba(248, 113, 113, 1)",
      "500":"rgba(237, 46, 46, 1)",
      "600":"rgba(220, 38, 38, 1)",
    }
    },
    
    typography:{
        fontFamily:  "IRANYekanWeb , B Traffic , Roboto , IRANSansWeb ,  vazir",
    },
    
})