import moment from 'moment';

export const getShift = (hour) => {
	const morning = moment('7:00', 'h:mma');
	const afternoon = moment('11:30', 'h:mma');
	const night = moment('18:00', 'h:mma');
	if(hour.isSame(morning) || (hour.isAfter(morning) && hour.isBefore(afternoon))){
		return 'manha';
	} else if(hour.isSame(afternoon) || (hour.isAfter(afternoon) && hour.isBefore(night))){
		return 'tarde';
	}
	return 'noite';
};
