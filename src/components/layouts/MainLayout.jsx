// src/components/layouts/MainLayout.jsx

import { ThemeProvider } from "@mui/material/styles";

import { CacheProvider } from "@emotion/react";

import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import { theme } from "./../ui/theme";
import stylisRTLPlugin from "@mui/stylis-plugin-rtl";
import { Box } from "@mui/material";



const cacheRTL = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, stylisRTLPlugin],
});


// ۱. اضافه کردن هوک useLocation برای تشخیص مسیر فعلی

import NotificationManager from "../../utils/NotificationManager";

const MainLayout = ({ children , }) => {
    


    

    

  return (
    <CacheProvider value={cacheRTL}>
      <ThemeProvider theme={theme}>
          <NotificationManager />
        
          
        
        <Box sx={{width:"calc(100%)", mx:"auto" , paddingBottom:"64px" , position:"relative", overflowX:"hidden" ,}}>
          
        {children}
       
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MainLayout;
