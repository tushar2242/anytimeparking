const path = require('path');
const fs = require('fs');

async function run() {
    const projectRoot = path.resolve(__dirname, '..');
    const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));

    console.log('1. Generating iOS App Icon...');
    const { setIconsAsync } = require('@expo/prebuild-config/build/plugins/icons/withIosIcons');
    await setIconsAsync(appJson.expo, projectRoot);

    console.log('2. Generating Android Launcher Icons...');
    const { setIconAsync } = require('@expo/prebuild-config/build/plugins/icons/withAndroidIcons');
    await setIconAsync(projectRoot, {
        icon: './assets/images/driverxlogo.png',
        backgroundColor: '#FFFFFF',
        backgroundImage: null,
        monochromeImage: null,
        isAdaptive: true,
    });

    console.log('3. Updating Splash Screen Logos...');
    try {
        const { setSplashImageDrawablesAsync } = require('@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashImages');
        await setSplashImageDrawablesAsync(
            appJson.expo,
            { image: './assets/images/driverxlogo.png', resizeMode: 'contain', backgroundColor: '#FFFFFF' },
            projectRoot,
            200
        );
    } catch (e) {
        console.log('Note on Android splash:', e.message);
    }

    try {
        const { setSplashImageAsync } = require('@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen');
        await setSplashImageAsync(
            appJson.expo,
            { image: './assets/images/driverxlogo.png', resizeMode: 'contain', backgroundColor: '#FFFFFF' },
            projectRoot
        );
    } catch (e) {
        console.log('Note on iOS splash:', e.message);
    }

    console.log('All icons successfully updated to driverxlogo.png!');
}

run().catch((err) => {
    console.error('Error generating icons:', err);
    process.exit(1);
});
