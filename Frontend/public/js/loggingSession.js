let chartsDateTimeFormats = {
    minTickInterval: 10,
    millisecond: '%M:%S.%L',
    second: '%H:%M:%S',
    minute: '%H:%M',
    hour: '%H:%M',
    day: '%e. %b',
    week: '%e. %b',
    month: '%b \'%y',
    year: '%Y'
};

Highcharts.stockChart('sessionGraph', {
    chart: {
        events: {
            load: function () {
            }
        }
    },

    rangeSelector: {
        buttons: [{
            count: 50,
            type: 'millisecond',
            text: '50mS'
        },{
            count: 200,
            type: 'millisecond',
            text: '200mS'
        },{
            count: 1,
            type: 'second',
            text: '1S'
        }, {
            count: 5,
            type: 'second',
            text: '5S'
        }, {
            type: 'all',
            text: 'All'
        }],
        inputEnabled: false,
        selected: 0
    },

    title: {
        text: 'Session Data Graph'
    },

    series: graphData,

    tooltip: {
        dateTimeLabelFormats: chartsDateTimeFormats
    },

    xAxis: {
        type: 'datetime',
        tickInterval: 10,
        dateTimeLabelFormats: chartsDateTimeFormats
    }
});
