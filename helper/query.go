package helper

import (
	"errors"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/json"
	_ "github.com/eaciit/dbox/dbc/mongo"
	"github.com/eaciit/toolkit"
)

type queryWrapper struct {
	ci         *dbox.ConnectionInfo
	connection dbox.IConnection
	err        error
}

func Query(driver string, host string, other ...interface{}) *queryWrapper {
	wrapper := queryWrapper{}
	wrapper.ci = &dbox.ConnectionInfo{host, "", "", "", nil}

	if len(other) > 0 {
		wrapper.ci.Database = other[0].(string)
	}
	if len(other) > 1 {
		wrapper.ci.UserName = other[1].(string)
	}
	if len(other) > 2 {
		wrapper.ci.Password = other[2].(string)
	}
	if len(other) > 3 {
		wrapper.ci.Settings = other[3].(toolkit.M)
	}

	wrapper.connection, wrapper.err = dbox.NewConnection(driver, wrapper.ci)
	wrapper.connection.Connect()
	return &wrapper
}

func (c *queryWrapper) SelectOne(clause *dbox.Filter) (toolkit.M, error) {
	if c.err != nil {
		return nil, c.err
	}

	connection := c.connection
	defer connection.Close()

	cursor, err := connection.NewQuery().Select().Where(clause).Cursor(nil)
	if err != nil {
		return nil, err
	}
	defer cursor.Close()

	data := make([]toolkit.M, 0)
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return nil, errors.New("No data found")
	}

	return data[0], nil
}

func (c *queryWrapper) Delete(clause *dbox.Filter) error {
	if c.err != nil {
		return c.err
	}

	connection := c.connection
	defer connection.Close()

	err := connection.NewQuery().Delete().Where(clause).Exec(nil)
	if err != nil {
		return err
	}

	return nil
}

func (c *queryWrapper) SelectAll(clause ...*dbox.Filter) ([]toolkit.M, error) {
	if c.err != nil {
		return nil, c.err
	}

	connection := c.connection
	defer connection.Close()

	query := connection.NewQuery().Select()
	if len(clause) > 0 {
		query = query.Where(clause[0])
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return nil, err
	}
	defer cursor.Close()

	data := make([]toolkit.M, 0)
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (c *queryWrapper) Save(payload map[string]interface{}, clause ...*dbox.Filter) error {
	if c.err != nil {
		return c.err
	}

	connection := c.connection
	defer connection.Close()

	if len(clause) == 0 {
		err := connection.NewQuery().Insert().Exec(toolkit.M{"data": payload})
		if err != nil {
			return err
		}

		return nil
	} else {
		err := connection.NewQuery().Update().Where(clause[0]).Exec(toolkit.M{"data": payload})
		if err != nil {
			return err
		}

		return nil
	}

	return errors.New("nothing changes")
}
