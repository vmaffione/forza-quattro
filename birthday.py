import webapp2
import cgi
import re


def valid_range(s, lb, ub):
    if not s.isdigit():
        return None

    n = int(s)
    if lb <= n and n <= ub:
        return n

    return None


def valid_date(month, day, year):
    return valid_range(month, 1, 12), valid_range(day, 1, 31), \
                valid_range(year, 1900, 2020)


form = """
<form method="post">
    What is your birthday?
    <br>
    <label>
        Month
        <input type="text" name="month" value="%(month)s">
    </label>
    <label>
        Day
        <input type="text" name="day" value="%(day)s">
    </label>
    <label>
        Year
        <input type="text" name="year" value="%(year)s">
    </label>
    <div style = "color: red"> %(error)s </div>

    <br>
    <br>
    <input type="submit">
</form>
"""


class BirthdayHandler(webapp2.RequestHandler):
    def write_form(self, error = '', month = '', day = '', year = ''):
        self.response.out.write(form % {'error': cgi.escape(error, quote = True),
                                        'month': cgi.escape(month, quote = True),
                                        'day'  : cgi.escape(day, quote = True),
                                        'year' : cgi.escape(year, quote = True)
                                        })

    def get(self):
        self.write_form()

    def post(self):
        month_user = self.request.get('month')
        day_user = self.request.get('day')
        year_user = self.request.get('year')

        month, day, year = valid_date(month_user, day_user, year_user)

        if not (month and day and year):
            self.write_form('That doesn\'t look valid to me, friend.',
                                month_user, day_user, year_user)
        else:
            self.redirect('/thanks')
