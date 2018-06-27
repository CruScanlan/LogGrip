var chartsDateTimeFormats = {
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

var chart = Highcharts.stockChart('sessionGraph', {
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
    field: 'time',
}];

for(var i=0; i<chartConfig.graphData.length; i++) {
    columns.push({
        title: chartConfig.graphData[i].name,
        field: chartConfig.graphData[i].name,
        visible: chartConfig.graphData[i].visible
    });
}

var table = $('#sessionData').tabulator({
    columns: columns,
    data: tableData,
    resizableColumns: false,
});

function showHideSeriesToggeled(sensorID, columnName) {
    var seriesIndex;
    for(var i=0; i<chart.series.length; i++) { //get graph series index for sensor
        if(chart.series[i].userOptions.id === sensorID) {
            seriesIndex = i;
            break;
        }
    }
    if(chart.series[seriesIndex].visible) chart.series[seriesIndex].hide();// = !chart.series[seriesIndex].visible;
    else chart.series[seriesIndex].show();// = !chart.series[seriesIndex].visible;

    table.tabulator("toggleColumn", columnName);

    var chartVisbible = chart.series[seriesIndex].visible;

    var request = {
        queryParams: {
            sessionID: logSessionID,
            sensorID,
            visible: chartVisbible ? 1 : 0
        }
    };

    $.ajax({
        url: '/api/db/update-sensor-visibility',
        type: 'POST',
        data: JSON.stringify(request),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            console.log(data);
            if(!data.success) return notify('danger', 'Error', 'Could not save data visibility');
        }
    });
}

function deleteLoggingSession(sessionID) {
    swal({
            title: "Are you sure to want to delete the logging session?",
            text: "",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-danger",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false,
            showLoaderOnConfirm: true
        },
        function(){
            $.ajax({
                url: '/api/logging-session/delete-session',
                type: 'POST',
                data: JSON.stringify({sessionID}),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function(data) {
                    if(!data.success) {
                        return swal({
                                title: "Error",
                                text: "There was an error deleting the logging session",
                                type: "danger",
                                confirmButtonText: "Ok",
                                closeOnConfirm: true
                        });
                    }
                    return swal({
                        title: "Success",
                        text: "The logging session was deleted",
                        type: "success",
                        confirmButtonText: "Ok",
                        closeOnConfirm: true
                    }, function() {
                        window.location = "/";
                    });
                }
            });
        });
    return;
}

function notify(type,title,message){
    $.notify({
        title: title,
        message: message
    },{
        element: 'body',
        position: null,
        type: type,
        allow_dismiss: true,
        newest_on_top: true,
        placement: {
            from: "top",
            align: "center"
        },
        offset: 20,
        spacing: 10,
        z_index: 1100,
        delay: 5000,
        timer: 1000
    });
}