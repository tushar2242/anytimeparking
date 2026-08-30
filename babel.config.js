module.exports = function (api) {
    const isWeb = api.caller((caller) => caller && caller.platform === 'web');
    api.cache.using(() => isWeb);

    const plugins = [];
    if (isWeb) {
        plugins.push([
            'module-resolver',
            {
                alias: {
                    'react-native-maps': './src/mocks/react-native-maps.tsx',
                    'react-native-maps-directions': './src/mocks/react-native-maps-directions.tsx',
                },
            },
        ]);
    }

    return {
        presets: ['babel-preset-expo'],
        plugins,
    };
};
