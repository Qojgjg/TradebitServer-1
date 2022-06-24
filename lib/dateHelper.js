import isEmpty from "./isEmpty";

export const dateFormat = (dateTime, format = 'YYYY-MM-DD') => {
    try {
        if (!isEmpty(dateTime)) {
            dateTime = new Date(dateTime);
            let year = dateTime.getFullYear(),
                month = dateTime.getMonth() + 1,
                day = dateTime.getDate();
            return format.replace('YYYY', year).replace('MM', month).replace('DD', day)
        }
    } catch (err) {
        return dateTime;
    }
}

export const timeFormat = (dateTime, format = 'HH:MM:SS') => {
    try {
        if (!isEmpty(dateTime)) {
            dateTime = new Date(dateTime);

            let hour = dateTime.getHours(),
                minute = dateTime.getMinutes(),
                second = dateTime.getSeconds();

            return format.replace('HH', hour).replace('MM', minute).replace('SS', second)
        }
    } catch (err) {
        return ''
    }
}

export const dateTimeFormat = (dateTime, format = 'YYYY-MM-DD HH:MM:SS') => {
    try {
        if (!isEmpty(dateTime)) {
            format = format.split(' ');
            return dateFormat(dateTime, format[0]) + ' ' + timeFormat(dateTime, format[1])
        }
    } catch (err) {
        return ''
    }
}

/** 
 * Find Between Dates Time
*/
export const findBtwDates = (startDateTime, endDateTIme, type = 'milliseconds') => {
    try {
        let roundTime = 1;

        switch (type) {
            case 'milliseconds': roundTime = 1; break;
            case 'seconds': roundTime = 1000 * 60; break;
            case 'hours': roundTime = 1000 * 60 * 60; break;
            case 'days': roundTime = 1000 * 60 * 60 * 24; break;
            default: roundTime = 1; break
        }

        return Math.ceil(Math.abs(new Date(endDateTIme) - new Date(startDateTime)) / roundTime);
    } catch (err) {
        return null
    }
}

export const nowDateInUTC = () => {
    try {
        let newDate = new Date();
        return new Date(`${newDate.getUTCFullYear()}-${('0' + newDate.getUTCMonth()).slice(-2)}-${('0' + newDate.getUTCDate()).slice(-2)}T${('0' + newDate.getUTCHours()).slice(-2)}:${('0' + newDate.getUTCMinutes()).slice(-2)}:${('0' + newDate.getUTCSeconds()).slice(-2)}.${('00' + newDate.getUTCMilliseconds()).slice(-3)}Z`)
    } catch (err) {
        return new Date();
    }
}
