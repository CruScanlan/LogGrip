var typingTimer;
var doneTypingInterval = 350;

(function() {
    var sessionSearch = $('#session-search');

    sessionSearch.on('keyup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(loadSessions, doneTypingInterval);
    });

    sessionSearch.on('keydown', function () {
        clearTimeout(typingTimer);
    });


    loadSessions();
})();

function loadSessions() {
    var request = {
        query: $('#session-search').val()
    };

    $.ajax({
        url: '/api/logging-home/get-user-sessions',
        type: 'POST',
        data: JSON.stringify(request),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data){
            var sessionsHtml = "";
            for(var i=0; i<data.sessions.length; i++) {
                var checked = !!data.sessions[i].enabled ? 'checked' : '';
                sessionsHtml += `
                    <div class="col-sm-6 col-md-4">
                      <div class="card">
                        <div class="card-header">
                          <a href="/logging/${data.sessions[i].session_id}">
                            <button type="button" class="btn btn-link" >${data.sessions[i].session_name}</button>
                          </a>
                          <label class="switch switch-sm switch-text switch-info float-right mb-0">
                            <input type="checkbox" class="switch-input" ${checked}>
                            <span class="switch-label" data-on="On" data-off="Off"></span>
                            <span class="switch-handle"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                `
            }
            $('.logging-sessions').html(sessionsHtml);
        }
    });
}