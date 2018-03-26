let chartsDateTimeFormats = {
    minTickInterval: 75,
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
            count: 100,
            type: 'millisecond',
            text: '100mS'
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

    series: chartConfig.graphData,

    tooltip: {
        dateTimeLabelFormats: chartsDateTimeFormats
    },

    plotOptions: {
        dataLabels: {
            overflow: true
        }
    },

    xAxis: {
        type: 'time',
        tickInterval: chartConfig.interval,
        dateTimeLabelFormats: chartsDateTimeFormats,
        tickPixelInterval: chartConfig.interval/2
    }
});

var columns = [{
    title: 'Time',
    field: 'time'
}];
var data = [];
for(var i=0; i<chartConfig.graphData.length; i++) {
    columns.push({
        title: chartConfig.graphData[i].name,
        field: chartConfig.graphData[i].name.match(/(?:\S)/g).join('').toLowerCase()
    });
}

$('#sessionData').tabulator({
    columns: columns,
    data: data
});
