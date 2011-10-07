select

n.notificationtype,
n.recipient,
n.recipient.name as name,
m.Userid,
m.Userid.DisplayName as UserName,
m.Userid.email as email,
from ehr.notificationrecipients n
left join core.members m on (n.recipient = m.GroupId)
where m.userid is not null

union all

select

n.notificationtype,
n.recipient,
n.recipient.name as name,
u.UserId,
u.DisplayName,
u.email,
from ehr.notificationrecipients n
left join core.users u on (n.recipient = u.userid)
where u.userid is not null