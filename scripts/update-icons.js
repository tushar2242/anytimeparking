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
        const { generateImageAsync } = require('@expo/image-utils');
        const iosNamedProjectRoot = path.join(projectRoot, 'ios', 'DriverX');
        const imageSetPath = path.join(iosNamedProjectRoot, 'Images.xcassets', 'SplashScreenLogo.imageset');
        const imageWidth = 200;

        for (const { ratio, suffix } of [{ ratio: 1, suffix: '' }, { ratio: 2, suffix: '@2x' }, { ratio: 3, suffix: '@3x' }]) {
            const size = imageWidth * ratio;
            const { source } = await generateImageAsync(
                { projectRoot, cacheType: 'splash-ios' },
                { src: path.join(projectRoot, 'assets/images/driverxlogo.png'), width: size, height: size }
            );
            fs.writeFileSync(path.join(imageSetPath, `image${suffix}.png`), source);
        }
        console.log('iOS splash screen logo images updated successfully.');
    } catch (e) {
        console.log('Note on iOS splash:', e.message);
    }

    console.log('All icons and splash screens successfully updated to driverxlogo.png with white background!');
}

run().catch((err) => {
    console.error('Error generating icons:', err);
    process.exit(1);
});
