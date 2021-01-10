/* Файл scormAPI.js */

var SCORM = null;
window.onload = null;
window.onbeforeunload = null;
window.onunload = null;

//конструктор для объекта, предоставляющего интерфейс к SCORM-API
function _SCORM() {
    // Переменная для отладки. Во время отладки устанавливается в true для показа
    // отладочной информации, в финальном варианте должна быть false
    this._debug = false;

    // локальные переменные
    this.apiHandle = null;
    this.findAPITries = 0;
    this.noAPIFound = false;
    this.terminated = false;

    /**
     * Функция поиска SCORM API в текущем фрейме (window) и во всех
     * родительских (parent)
     * Параметры:  объект window
     * Возвращает: объект SCORM API, если таковой был найден, в противном случае - null
     */
    this.findAPI = function(win) {
        try{
            while (!win.API_1484_11) {
                this.findAPITries++;
                if (this.findAPITries > 100) {
                    if (this._debug) {
                        alert("Не удалось найти реализацию SCORM API. (100 попыток) ");
                    }
                    return null;
                }
                if (win.parent == null || win.parent == win) {
                    break;
                }
                win = win.parent
            }
            return win.API_1484_11;
        } catch (ex){
            console.error("Не удалось найти реализацию SCORM API! ", ex.message);
            return null;
        }
    };

    /**
     * Функция возвращает SCORM API, если таковой был найден в текущем фрейме (window),
     * в каком либо из его родительских (parent), в окне opener, или его
     * родительских. В противном случае возвращается null.
     */
    this.getAPI = function() {
        if (this.apiHandle == null && !this.noAPIFound) {
            for (var curWnd = window; curWnd && typeof(curWnd) != "undefined"; curWnd = curWnd.opener) {
                var theAPI = this.findAPI(curWnd);
                if (theAPI) {
                    this.apiHandle = theAPI;
                    break;
                }
            }

            if (this.apiHandle == null) {
                if (this._debug) {
                    alert("Не удалось найти реализацию SCORM API.");
                }
                this.noAPIFound = true;
            }
        }

        return this.apiHandle;
    };


    /*******************************************************************************
     * Данная функция вызывается для инициализации сессии. Функция должна вызываться
     * до вызовов getDataValue, setDataValue, или terminate
     * Возвращает: "true", если процесс инициализации прошел успешно, в противном
     *             случае - "false".
     *******************************************************************************/
    this.initialize = function() {
        var result = "false";
        var api = this.getAPI();
        if (api != null) {
            result = api.Initialize("");
            if (result != "true") {
                this.displayErrorInfo(this.getLastErrorCode());
            }
        }
        return result;
    };

    /*******************************************************************************
     * Данная функция вызывается для завершения сессии. После ее вызова нельзя
     * вызывать функции initialize, getDataValue или setDataValue
     * Возвращает: "true", если прошло успешно, в противном случае - "false".
     *******************************************************************************/
    this.terminate = function() {
        var result = "false";
        var api = this.getAPI();
        if (api != null) {
            if (!this.terminated) {
                result = api.Terminate("");
                if (result != "true") {
                    this.displayErrorInfo(this.getLastErrorCode());
                } else {
                    this.terminated = true;
                }
            }
        }
        return result;
    };

    /*******************************************************************************
     * Функция запрашивает у Системы значение модели данных. Может вызываться после
     * вызова initialize, но до вызова terminate
     * Параметры:  название элемента модели данных (напр. "cmi.learner_id")
     * Возвращает: значение запрашиваемых данных
     *******************************************************************************/
    this.getDataValue = function(name) {
        var result = "";
        var api = this.getAPI();
        if (!this.terminated && api != null) {
            result = api.GetValue(name);
            var errCode = this.getLastErrorCode();
            if (errCode != "0") {
                this.displayErrorInfo(errCode);
            }
        }
        return result;
    };

    /*******************************************************************************
     * Функция сохраняет значение в модели данных, определенное значением name.
     * Может вызываться после вызова initialize, но до вызова terminate.
     * Параметры:  @name - название элемента модели данных
     *              @value - сохраняемое значение
     * Возвращает: true - если успешно, false - при ошибке.
     *******************************************************************************/
    this.setDataValue = function(name, value) {
        var result = "false";
        var api = this.getAPI();
        if (!this.terminated && api != null) {
            result = api.SetValue(name, value);
            if (result != "true") {
                this.displayErrorInfo(this.getLastErrorCode());
            }
        }
        return result;
    };

    /*******************************************************************************
     * Донная функция дает команду Системе на сохранение последних изменений.
     * Может вызываться после вызова initialize, но до вызова terminate.
     *******************************************************************************/
    this.commitData = function() {
        var result = "false";
        var api = this.getAPI();
        if (!this.terminated && api != null) {
            result = api.Commit("");
            if (result != "true") {
                this.displayErrorInfo(this.getLastErrorCode());
            }
        }
        return result;
    };

    /*******************************************************************************
     * Функция возвращает код последней ошибки.
     * Возвращает: строку с кодом ошибки (возвращает "0" - если не было ошибки).
     *******************************************************************************/
    this.getLastErrorCode = function() {
        var api = this.getAPI();
        return ( api == null) ? ("") : ( api.GetLastError() );
    };

    /*******************************************************************************
     * Вспомогательная функция для показа информации об ошибке (код ошибки, описание
     * и диагностическую информацию)
     * Параметры:  errCode - код ошибки
     *******************************************************************************/
    this.displayErrorInfo = function(errCode) {
        var errString, errDiagnostic;
        if (this._debug) {
            var api = this.getAPI();
            if (api != null) {
                errString = api.GetErrorString(errCode);
                errDiagnostic = api.GetDiagnostic("");
            }
            alert("Ошибка SCORM RTE: " + errCode + " - " + errString + "\n\n" + errDiagnostic);
        }
    };
    
    this.isAvailable = function(){
        return SCORM.getAPI()!= null;
    }

    //helpers
    this.getLearnerID = function() {
        return this.getDataValue("cmi.learner_id");
    }
    this.getLearnerName = function() {
        return this.getDataValue("cmi.learner_name");
    }
    this.getScore = function() {
        return this.getDataValue("cmi.score.scaled");
    }
    this.setScore = function( score ) {
        return this.setDataValue("cmi.score.scaled", score);
    }
    this.getScoreMin = function() {
        return this.getDataValue("cmi.score.min");
    }
    this.setScoreMin = function( score ) {
        return this.setDataValue("cmi.score.min", score);
    }
    this.getScoreMax = function() {
        return this.getDataValue("cmi.score.max");
    }
    this.setScoreMax = function( score ) {
        return this.setDataValue("cmi.score.max", score);
    }
    this.getScoreRaw = function() {
        return this.getDataValue("cmi.score.raw");
    }
    this.setScoreRaw = function( score ) {
        return this.setDataValue("cmi.score.raw", score);
    }
    this.getSuspendData = function() {
        return this.getDataValue("cmi.suspend_data");
    }
    this.setSuspendData = function( data ) {
        return this.setDataValue("cmi.suspend_data", data);
    }
    this.setIntermediateCommit = function( isIntermediate ) {
        var value = "" + isIntermediate;
        var result = "false";
        var api = this.getAPI();
        if (!this.terminated && api != null) {
            result = api.SetValue("_1c.intermediate_commit", value);
        }
        return result;
    }
    this.isIntermediateCommit = function( ) {
        var result = "";
        var api = this.getAPI();
        if (!this.terminated && api != null) {
            result = api.GetValue("_1c.intermediate_commit");
            var errCode = this.getLastErrorCode();
            if (errCode != "0"){
                result = undefined;
            }
        }
        return result;
    }
    //advanced SCORM reporting
    this.interactionsCount = function( ) {
        return this.getDataValue("cmi.interactions._count ");
    }
    this.getInteractionID = function( index ) {
        return this.getDataValue("cmi.interactions."+index+".id");
    }
    this.setInteractionID = function( index, id ) {
        return this.setDataValue("cmi.interactions."+index+".id", id);
    }
    this.getInteractionType = function( index ) {
        return this.getDataValue("cmi.interactions."+index+".type");
    }
    this.setInteractionType = function( index, type ) {
        return this.setDataValue("cmi.interactions."+index+".type", type);
    }
    this.getInteractionLearnerResponse = function( index ) {
        return this.getDataValue("cmi.interactions."+index+".learner_response");
    }
    this.setInteractionLearnerResponse = function( index, learnerResponse ) {
        return this.setDataValue("cmi.interactions."+index+".learner_response", learnerResponse);
    }
    this.getInteractionResult = function( index ) {
        return this.getDataValue("cmi.interactions."+index+".result");
    }
    this.setInteractionResult = function( index, result ) {
        return this.setDataValue("cmi.interactions."+index+".result", result);
    }
    this.getInteractionDescription = function( index ) {
        return this.getDataValue("cmi.interactions."+index+".description");
    }
    this.setInteractionDescription = function( index, description ) {
        return this.setDataValue("cmi.interactions."+index+".description", description);
    }
    //advanced SCORM reporting: suggested functions
    this.saveInteractionResult = function (modelID,objectID,sheetID,result,question,answer){
        if(SCORM.isAvailable()){
            var index = SCORM.findInteractionIndexForObject(modelID,objectID, sheetID);
            if(index == -1){
                index = SCORM.interactionsCount();
                SCORM.setInteractionID(index,""+modelID+"_"+sheetID+"_"+objectID);
                SCORM.setInteractionType(index,"long-fill-in");
            }
            SCORM.setInteractionResult(index,result);
            SCORM.setInteractionDescription(index,question);
            SCORM.setInteractionLearnerResponse(index,answer);
        }
    }
    this.findInteractionIndexForObject = function(modelID,objectID,sheetID){
        if(SCORM.isAvailable()){
            var _count = SCORM.interactionsCount();
            for(var i = 0; i<_count; i++){
                if(SCORM.getInteractionID(i).localeCompare(""+modelID+"_"+sheetID+"_"+objectID) == 0){
                    return i;
                }
            }
            return -1;
        }
    }
}

var SCORM = new _SCORM();
window.onload = function() {
    SCORM.initialize();
};
window.onbeforeunload = function() {
    SCORM.terminate();
};
window.onunload = function() {
    SCORM.terminate();
};