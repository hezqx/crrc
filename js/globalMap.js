/* 全球地图：修改 points 中的经纬度、标题和介绍即可维护标记内容。 */
(function ($, d3, topojson) {
    'use strict';

    var points = [
        { id: 'canada', name: '加拿大', region: '北美洲 / NORTH AMERICA', coordinates: [-106, 56], description: '加拿大区域介绍：关注城市轨道交通、通勤运输与车辆全生命周期服务。本条为地图交互演示，可替换为当地项目、服务网络及合作案例。' },
        { id: 'usa', name: '美国', region: '北美洲 / NORTH AMERICA', coordinates: [-87.6, 41.9], description: '美国区域介绍：展示城市公共交通、轨道车辆及运营维护相关内容。可在此补充项目所在城市、交付车型和服务信息。' },
        { id: 'greenland', name: '格陵兰', region: '北美洲 / NORTH AMERICA', coordinates: [-42, 70], description: '格陵兰位置示意：此标记用于还原设计图的地理分布，不代表中车在当地设有项目。正式上线前请按真实业务数据调整或删除。' },
        { id: 'uk', name: '英国', region: '欧洲 / EUROPE', coordinates: [-2, 54], description: '英国区域介绍：可展示轨道交通技术交流、产品方案及本地服务信息。当前为演示文案，请替换为经过确认的业务介绍。' },
        { id: 'france', name: '法国', region: '欧洲 / EUROPE', coordinates: [2.3, 46.6], description: '法国区域介绍：围绕轨道交通装备、绿色出行与技术合作展示区域信息。可补充实际合作伙伴、产品与项目进展。' },
        { id: 'spain', name: '西班牙', region: '欧洲 / EUROPE', coordinates: [-3.7, 40.4], description: '西班牙区域介绍：可展示城市交通、区域铁路与维护服务解决方案。本条为示例，不构成实际业务覆盖声明。' },
        { id: 'germany', name: '德国', region: '欧洲 / EUROPE', coordinates: [13.4, 52.5], description: '德国区域介绍：可展示轨道交通装备、技术研发及服务网络。请根据已公开的项目信息补充正式介绍。' },
        { id: 'kazakhstan', name: '哈萨克斯坦', region: '亚洲 / ASIA', coordinates: [68, 49], description: '哈萨克斯坦区域介绍：关注铁路运输、区域互联互通及装备服务需求。此处可配置当地项目的车辆类型、应用场景和服务内容。' },
        { id: 'russia', name: '俄罗斯', region: '亚洲 / ASIA', coordinates: [132, 61], description: '俄罗斯区域介绍：可展示铁路运输装备及适应不同环境的产品方案。标记位置为区域示意，并非具体项目地址。' },
        { id: 'brazil', name: '巴西', region: '南美洲 / SOUTH AMERICA', coordinates: [-47, -16], description: '巴西区域介绍：围绕城市轨道交通和通勤出行展示产品与服务。可替换为实际项目名称、车辆交付及运营维护介绍。' },
        { id: 'southAfrica', name: '南非', region: '非洲 / AFRICA', coordinates: [28, -26], description: '南非区域介绍：可展示铁路运输装备、本地化协作与维护服务。当前文案仅用于演示，具体项目以正式披露为准。' },
        { id: 'australia', name: '澳大利亚', region: '大洋洲 / OCEANIA', coordinates: [145, -27], description: '澳大利亚区域介绍：可展示城市轨道车辆、通勤列车及全生命周期服务。请在此补充实际产品、项目和客户服务信息。' }
    ];

    /* 初始化地图，所有地形和标记均使用同一地理投影。 */
    function initGlobalMap() {
        var $root = $('.globalMap');
        if (!$root.length) {
            return;
        }
        if (!d3 || !topojson || !window.globalMapAtlas) {
            $root.find('.mapHint').text('地图资源加载失败，请刷新页面重试。');
            return;
        }

        var atlas = window.globalMapAtlas;
        var countries = topojson.feature(atlas, atlas.objects.countries).features;
        var world = { type: 'FeatureCollection', features: countries.filter(function (country) {
            /* 不绘制南极洲，以突出业务区域。 */
            return country.id !== '010';
        }) };
        var projection = d3.geoNaturalEarth1().fitExtent([[20, 32], [980, 548]], world);
        var geoPath = d3.geoPath(projection);
        var svg = d3.select($root.find('.globalMapSvg')[0]);
        var china = countries.filter(function (country) {
            /* 使用数据中的中国地理要素。 */
            return country.id === '156';
        })[0];
        var origin = projection([104, 35]);
        var activeIndex = null;
        var $popup = $root.find('.mapPopup');
        var defs = svg.append('defs');
        var gradient = defs.append('linearGradient').attr('id', 'globalMapGradient').attr('x2', '0%').attr('y2', '100%');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', '#95dcfc');
        gradient.append('stop').attr('offset', '100%').attr('stop-color', '#9aaeff');
        defs.append('pattern').attr('id', 'globalMapDots').attr('width', 7.5).attr('height', 7.5)
            .attr('patternUnits', 'userSpaceOnUse').append('circle').attr('cx', 3.75).attr('cy', 3.75).attr('r', 2.05).attr('fill', '#fff');
        defs.append('mask').attr('id', 'globalMapDotMask').attr('maskUnits', 'userSpaceOnUse')
            .attr('x', 0).attr('y', 0).attr('width', 1000).attr('height', 580)
            .append('rect').attr('width', 1000).attr('height', 580).attr('fill', 'url(#globalMapDots)');
        svg.append('path').datum(world).attr('d', geoPath).attr('fill', 'url(#globalMapGradient)')
            .attr('mask', 'url(#globalMapDotMask)').attr('aria-hidden', 'true');

        var routes = svg.append('g').attr('class', 'mapRoutes').attr('aria-hidden', 'true');
        points.forEach(function (point, index) {
            /* 二次曲线连接投影后的地理位置。 */
            var end = projection(point.coordinates);
            var lift = Math.min(135, Math.abs(end[0] - origin[0]) * 0.23 + 35);
            routes.append('path').attr('class', 'mapRoute').attr('data-index', index)
                .attr('d', 'M' + origin.join(',') + ' Q' + [(origin[0] + end[0]) / 2, Math.min(origin[1], end[1]) - lift].join(',') + ' ' + end.join(','));
        });
        svg.append('path').datum(china).attr('d', geoPath).attr('class', 'mapChina').attr('aria-hidden', 'true');
        svg.append('text').attr('x', origin[0]).attr('y', origin[1] + 5).attr('class', 'mapChinaLabel')
            .attr('text-anchor', 'middle').text('CRRC').attr('aria-hidden', 'true');

        var markers = svg.append('g').attr('class', 'mapMarkers').selectAll('g').data(points).join('g')
            .attr('class', 'mapMarker').attr('data-index', function (point, index) {
                /* 用 data-index 匹配节点与介绍配置。 */
                return index;
            }).attr('transform', function (point) {
                /* 按经纬度定位，不使用手工百分比。 */
                return 'translate(' + projection(point.coordinates).join(',') + ')';
            }).attr('role', 'button').attr('tabindex', 0).attr('aria-expanded', 'false')
            .attr('aria-label', function (point) {
                /* 为键盘与读屏用户提供地点名称。 */
                return '查看' + point.name + '介绍';
            });
        markers.append('circle').attr('r', 16).attr('fill', 'transparent');
        markers.append('circle').attr('class', 'mapMarkerHalo').attr('r', 14).attr('cy', -9);
        markers.append('path').attr('class', 'mapMarkerPin').attr('d', 'M0,0 C-3,-4 -8,-8 -8,-13 A8,8 0 1,1 8,-13 C8,-8 3,-4 0,0 Z');
        markers.append('circle').attr('cx', 0).attr('cy', -13).attr('r', 2.8).attr('fill', '#fff');
        markers.append('title').text(function (point) {
            /* 原生提示辅助识别密集地区的标记。 */
            return point.name;
        });

        /* 将弹层放在标记附近，并限制在地图容器内。 */
        function positionPopup() {
            if (activeIndex === null) {
                return;
            }
            var position = projection(points[activeIndex].coordinates);
            var width = $root.width();
            var scale = width / 1000;
            var popupWidth = $popup.outerWidth();
            var left = Math.max(8, Math.min(width - popupWidth - 8, position[0] * scale + 18));
            var top = position[1] * scale - $popup.outerHeight() - 26;
            $popup.css({ left: left, top: Math.max(8, top) });
        }

        /* 关闭当前介绍，可选恢复键盘焦点。 */
        function closePopup(restoreFocus) {
            var previousIndex = activeIndex;
            activeIndex = null;
            $popup.prop('hidden', true);
            $root.find('.mapMarker').removeClass('mapMarkerActive').attr('aria-expanded', 'false');
            $root.find('.mapRoute').removeClass('mapRouteActive');
            $root.find('.mapHint').text('点击地图标记，了解区域介绍');
            if (restoreFocus && previousIndex !== null) {
                $root.find('.mapMarker[data-index="' + previousIndex + '"]')[0].focus();
            }
        }

        /* 统一处理鼠标、触屏和键盘触发。 */
        function openPopup(index) {
            if (activeIndex === index) {
                closePopup(false);
                return;
            }
            closePopup(false);
            activeIndex = index;
            var point = points[index];
            $popup.find('.mapPopupRegion').text(point.region);
            $popup.find('.mapPopupTitle').text(point.name);
            $popup.find('.mapPopupDesc').text(point.description);
            $popup.prop('hidden', false);
            $root.find('.mapMarker[data-index="' + index + '"]').addClass('mapMarkerActive').attr('aria-expanded', 'true');
            $root.find('.mapRoute[data-index="' + index + '"]').addClass('mapRouteActive');
            $root.find('.mapHint').text('当前查看：' + point.name + '。按 Esc 关闭介绍。');
            positionPopup();
        }

        $root.on('click.globalMap', '.mapMarker', function () {
            /* 点击标记切换对应介绍。 */
            openPopup(Number($(this).attr('data-index')));
        }).on('keydown.globalMap', '.mapMarker', function (event) {
            /* Enter 和空格执行与点击相同的操作。 */
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openPopup(Number($(this).attr('data-index')));
            }
        }).on('click.globalMap', '.mapPopupClose', function () {
            /* 关闭按钮恢复当前标记焦点。 */
            closePopup(true);
        });
        $(document).on('click.globalMap', function (event) {
            /* 点击标记和弹层以外的位置收起介绍。 */
            if (!$(event.target).closest('.mapMarker, .mapPopup').length) {
                closePopup(false);
            }
        }).on('keydown.globalMap', function (event) {
            /* Escape 退出弹层。 */
            if (event.key === 'Escape' && activeIndex !== null) {
                closePopup(true);
            }
        });
        $(window).on('resize.globalMap', positionPopup);
    }

    $(initGlobalMap);
})(jQuery, window.d3, window.topojson);
