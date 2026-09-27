import { useEffect } from 'react';

/**
 * Custom React Hook to dynamically inject Facebook Pixel and ChatGPT/custom scripts
 */
export const usePixelInjector = (facebookPixelId, chatgptPixelScript) => {
    useEffect(() => {
        // 1. Inject Facebook Pixel
        if (facebookPixelId && !document.getElementById('fb-pixel-script')) {
            const fbScript = document.createElement('script');
            fbScript.id = 'fb-pixel-script';
            fbScript.innerHTML = `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${facebookPixelId}');
                fbq('track', 'PageView');
            `;
            document.head.appendChild(fbScript);
        }

        // 2. Inject ChatGPT / Custom Analytics Script
        if (chatgptPixelScript && !document.getElementById('chatgpt-custom-pixel')) {
            const customContainer = document.createElement('div');
            customContainer.id = 'chatgpt-custom-pixel';
            customContainer.innerHTML = chatgptPixelScript;
            document.head.appendChild(customContainer);
        }
    }, [facebookPixelId, chatgptPixelScript]);
};
