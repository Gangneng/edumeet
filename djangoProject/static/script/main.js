/* main menu */
$('.cafe').css('display','none')  
$('.parallaxboard').css('display','none')  

tl = new TimelineMax({ paused: true });
tl.to(".menu-left", 1, {left: 0,ease: Expo.easeInOut,});
tl.to(".menu-right",1,{right: 0,ease: Expo.easeInOut,},"-=1");
tl.staggerFrom(".menu-links > div",0.8,{y: 100,	opacity: 0,	ease: Expo.easeOut,},"0.1","-=0.4");
tl.staggerFrom(".mail > div, .socials > div",0.8,{	y: 100,	opacity: 0,	ease: Expo.easeOut,},"0.1","-=1");
tl.from(".menu-close",1,{scale: 0,opacity: 1,ease: Expo.easeInOut,},"-=1");
tl.to(".hr",0.4,{scaleY: 1,transformOrigin: "0% 50%",ease: Power2.ease,},"-=2");
tl.reverse();
$(document).on("click", ".menu-open", function () {
    tl.reversed(!tl.reversed());
    $('.menu-top-contain').css('pointer-events','all')
});
$(document).on("click", ".menu-close", function () {
    tl.reversed(!tl.reversed());
    $('.menu-top-contain').css('pointer-events','none')
});
/* click menu option */
$('.menu-link').on('click', 'a', function(){
    $(clicked).prop('id','unclicked');
    this.id = 'clicked';
    $('.cafe').css('display','none')  
    $('.parallaxboard').css('display','none')  
    
    if (this.text == "CAFE 02"){
        $('.cafe').css('display','block')
    }
    if (this.text == "EDA 03"){
        $('.parallaxboard').css('display','block')
    }
    
});

/* ==== cafe ==== */
/* cafe maker */
$('.btn').on('click','input', function(){
    cafe_click = this.id;
    $('#submit_coffee').prop('name',cafe_click);
    if (cafe_click == "delet"){
        if (document.getElementById('check')){
            document.getElementById("submit_coffee").click();
        }
    }
    if (cafe_click == "create" ){
        $(".clickdataboard").css('display','block');
    }
    else if (cafe_click == "update" && document.getElementById('check')){

        $(".clickdataboard").css('display','block');
    }
    else{
        $(".clickdataboard").css('display','none');

    }

});

/* table check */
var table = document.getElementById('cafe_tb'),rIndex;
for (var i = 0; i < table.rows.length; i++)
{
    table.rows[i].onclick = function()
    {
        rIndex = this.rowIndex;
        console.log(this.getAttribute('name'));
        document.getElementById('cafe_id').value =  this.getAttribute('name');
        document.getElementById('id_name').value = this.cells[1].innerHTML;
        document.getElementById('id_price').value = this.cells[2].innerHTML;
        if (document.getElementById('check')){
            document.getElementById('check').id = "uncheck";
        }
        this.id ="check";
    }
}



/* close box */
$("#maker").click(function(){
    $(".clickdataboard").css('display','none')
});


/* ==== EDA==== */
/* pallax */
$(window).scroll(function(){
    const scrollTop = $(window).scrollTop() + $(window).height();

    //나타나기
    if( scrollTop >  $("#section1").offset().top ){
        $("#section1").addClass("show");
    }
    if( scrollTop >  $("#section2").offset().top ){
        $("#section2").addClass("show");
    }
    if( scrollTop >  $("#section3").offset().top ){
        $("#section3").addClass("show");
    }
    if( scrollTop >  $("#section4").offset().top ){
        $("#section4").addClass("show");
    }
    if( scrollTop >  $("#section5").offset().top ){
        $("#section5").addClass("show");
    }
    if( scrollTop >  $("#section6").offset().top ){
        $("#section6").addClass("show");
    }
    if( scrollTop >  $("#section7").offset().top ){
        $("#section7").addClass("show");
    }
    if( scrollTop >  $("#section8").offset().top ){
        $("#section8").addClass("show");
    }
    if( scrollTop >  $("#section9").offset().top ){
        $("#section9").addClass("show");
    }
});


