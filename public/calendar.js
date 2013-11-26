
$('.datepicker').pickadate({
    formatSubmit: 'yyyy-mm-dd',
    format: 'yyyy-mm-dd',
});
$('.timepicker').pickatime({
  format: 'HH:i:00',
  formatLabel: function(time) {
    var hours = ( time.pick - this.get('now').pick ) / 60,
        label = hours < 0 ? ' !hours to now' : hours > 0 ? ' !hours from now' : 'now'
    return  'h:i a <sm!all>' + ( hours ? Math.abs(hours) : '' ) + label +'</sm!all>'
  },
  formatSubmit: 'HH:i:00',
  hiddenPrefix: 'prefix__',
  hiddenSuffix: '__suffix',
  now: 'picker__list-item--now',
});
    /*
    $('#startdate').datetimepicker({
        format: 'dd/MM/yyyy hh:mm:ss',
        language: 'en'
      });
    $('#enddate').datetimepicker({
        format: 'dd/MM/yyyy hh:mm:ss',
        language: 'en'
      });*/
   

    $('#addevent').submit(function(e){
        e.preventDefault();
        //$("#msg_modal").remove();
        $('#addevent').addClass("loading");        
        $.ajax({ 
           url: 'http://localhost:5000/event',
           type: 'POST',
           cache: false, 
           data: $("#addevent").serialize(), 
           success: function(data){
              $('#addevent').removeClass("loading");  
              console.log('Success!', data);
              //if(data.error && data.message){
                  /*var msg = '<div class="ui modal" id="msg_modal" >'+
                    '<i class="close icon"></i>'+
                    '<div class="header">'+
                     'Event Calendar'
                    '</div>'+
                    '<div class="content">' +   (data.message || 'Update New Event complete !')
                    '</div>'+
                    '<div class="actions">'+
                      '<div class="ui button">OK</div>'+
                    '</div>'+
                  '</div>';

                  $('body').append(msg);*/
                  $("#success_modal").modal('setting', {
                    closable  : false,
                    onDeny    : function(){
                      window.location.reload();
                      return false;
                    },
                    onApprove : function() {
                      window.location.reload();
                    }
                  }).modal('show');
                  
              //}
           }
           , error: function(jqXHR, textStatus, err){
              $('#addevent').removeClass("loading");  
               console.log('text status '+textStatus+', err '+err);
               /*var msg = '<div class="ui modal" id="msg_modal" >'+
                '<i class="close icon"></i>'+
                '<div class="header">'+
                 'Error Occur!'
                '</div>'+
                '<div class="content">' +   textStatus
                '</div>'+
                '<div class="actions">'+
                  '<div class="ui button">OK</div>'+
                '</div>'+
              '</div>';

              $('body').append(msg);*/
              
              $("#fail_msg").html( textStatus+' , Error : '+err);
              $("#fail_modal").modal('setting', {
                    closable  : false,
                    onDeny    : function(){
                      $('#form_event').modal('show');
                      return false;
                    },
                    onApprove : function() {
                      $('#form_event').modal('show');
                    }
                  }).modal('show');
           }
        })
     });    
    $('#addevent')
      .form({
        summary: {
          identifier  : 'summary',
          rules: [
            {
              type   : 'empty',
              prompt : 'Please enter your summary title of event.'
            }
          ]
        }/*,
        description: {
          identifier  : 'description',
          rules: [
            {
              type   : 'empty',
              prompt : 'Please enter your description'
            }
          ]
        },
        email: {
          identifier : 'email',
          rules: [
            {
              type   : 'email',
              prompt : 'Please enter an email'
            }
          ]
        }*/,
        startdate: {
          identifier : 'startdate',
          rules: [
            {
              type   : 'empty',
              prompt : 'Please enter a start date'
            },
            {
              type   : 'length[10]',
              prompt : 'Your start date must be yyyy-mm-dd'
            }
          ]
        },
        enddate: {
          identifier : 'enddate',
          rules: [
            {
              type   : 'empty',
              prompt : 'Please enter a end date'
            },
            {
              type   : 'length[10]',
              prompt : 'Your end date must be at yyyy-mm-dd'
            }
          ]
        } 
      })
    ;

jQuery(document).ready(function() {
  jQuery("abbr.timeago").timeago();
});